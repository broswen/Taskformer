'use strict';

const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB.DocumentClient();

const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpErrorHandler = require('@middy/http-error-handler');
const validator = require('@middy/validator');

var createError = require('http-errors');

const KSUID = require('ksuid');

const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        userId: { type: 'string', minLength: 3 }
      },
      required: ['userId']
    }
  }
}

const createTask = async event => {

  const {userId} = event.body;

  const taskId = await KSUID.random();

  const params = {
    TableName: process.env.TASKS_TABLE,
    Item: {
      PK: taskId.string,
      SK: taskId.string,
      PK2: userId
    }
  }

  try {
    const response = await DDB.put(params).promise();
  } catch (error) {
    console.log(error);
    throw createError(500, "unable to create task");
  }

  return {
    statusCode: 201,
    body: JSON.stringify(
      {
        taskid: taskId.string,
        userId
      },
    ),
  };
};


const handler = middy(createTask)
  .use(jsonBodyParser()) 
  .use(validator({inputSchema})) 
  .use(httpErrorHandler());

module.exports = { handler }