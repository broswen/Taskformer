'use strict';

const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB.DocumentClient();

const handler = async event => {
  console.log(event);

  //get item from dynamodb
  //check definition path exists

  const params = {
    TableName: process.env.TASKS_TABLE,
    Key: {
      PK: event.taskId,
      SK: event.taskId
    }
  }

  let task;
  try {
    task = await DDB.get(params).promise();
  } catch (error) {
    console.log(error);
    throw error;
  }

  if (task.Item.definitionkey === undefined) throw new Error("definition key undefined");

  event.definitionKey = task.Item.definitionkey;

  return event;
};


module.exports = { handler }