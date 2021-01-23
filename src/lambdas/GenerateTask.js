'use strict';

const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB.DocumentClient();
const STFN = new AWS.StepFunctions();


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
      },
      required: ['userId', 'taskId']
    }
  }
}

const generateTask = async event => {

  const {userId, taskId} = event.body;

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


  const params2 = {
    stateMachineArn: process.env.GEN_STFN,
    input: JSON.stringify({
      taskId,
      userId
      }),
  }

  let execution;
  try {
    execution = await STFN.startExecution(params2).promise();
  } catch (error) {
    console.log(error);
    throw createError(500, "couldn't start task generation");
  }

  return {
    statusCode: 200,
    body: `STARTED ${execution.startDate}`
  };
};


const handler = middy(generateTask)
  .use(jsonBodyParser()) 
  .use(validator({inputSchema})) 
  .use(httpErrorHandler());

module.exports = { handler }