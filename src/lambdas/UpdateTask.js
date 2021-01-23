'use strict';

const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3();

const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpErrorHandler = require('@middy/http-error-handler');
const validator = require('@middy/validator');

var createError = require('http-errors');

const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        userId: { type: 'string', minLength: 3 },
        taskId: { type: 'string', minLength: 3 },
        definition: { type: 'object' }
      },
      required: ['userId', 'taskId', 'definition']
    }
  }
}

const updateTask = async event => {

  const {userId, taskId, definition} = event.body;

  const params3 = {
     TableName: process.env.TASKS_TABLE,
      Key: {
        PK: taskId,
        SK: taskId
      }
  }

  let task;
  try {
    task = await DDB.get(params3).promise();
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't get task");
  }

  if (task.Item === undefined) throw createError(404, "task not found");

  const key = `${userId}-${taskId}.json`;

  const params = {
    Bucket: process.env.DEF_BUCKET,
    Key: key,
    Body: Buffer.from(JSON.stringify(definition))
  }

  try {
    const response = await S3.putObject(params).promise(); 
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't upload definition");
  }

  const params2 = {
    TableName: process.env.TASKS_TABLE,
    Key: {
      PK: taskId,
      SK: taskId
    },
    UpdateExpression: "set #l = :l, #u = :u",
    ExpressionAttributeNames: {
      "#l" : "definitionkey",
      "#u" : "lastupdated",
    },
    ExpressionAttributeValues: {
      ":l" : key,
      ":u" : new Date().toISOString()
    }
  }

  try {
    const response = await DDB.update(params2).promise();
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't update task");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        taskId,
        userId,
        definitionKey: key
      },
    ),
  };
};


const handler = middy(updateTask)
  .use(jsonBodyParser()) 
  .use(validator({inputSchema})) 
  .use(httpErrorHandler());

module.exports = { handler }