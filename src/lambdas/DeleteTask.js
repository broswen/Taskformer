'use strict';

const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB.DocumentClient();
const S3 = new AWS.S3();

const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpErrorHandler = require('@middy/http-error-handler');
var createError = require('http-errors');

const deleteTask = async event => {

  const {taskId} = event.pathParameters;

  const params = {
    TableName: process.env.TASKS_TABLE,
    Key: {
      PK: taskId,
      SK: taskId
    }
  }

  let task;
  try {
    task = await DDB.get(params).promise();
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't get task");
  }

  if (task.Item === undefined) throw createError(404, "task not found");

  const userId = task.Item.PK2;
  const key = `${userId}-${taskId}.json`;

  const params2 = {
    Bucket: process.env.DEF_BUCKET,
    Key: key,
  }

  try {
    await S3.deleteObject(params2).promise(); 
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't delete task definition");
  }

  try {
    await DDB.delete(params).promise();
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't delete task");
  }

  return {
    statusCode: 200,
    body: "DELETED"
  };
};


const handler = middy(deleteTask)
  .use(jsonBodyParser()) 
  .use(httpErrorHandler());

module.exports = { handler }