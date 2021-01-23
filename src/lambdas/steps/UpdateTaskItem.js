'use strict';

const AWS = require('aws-sdk');
const DDB = new AWS.DynamoDB.DocumentClient();

const handler = async event => {
  console.log(event);

  //update dynamodb item with new lastgenerated timestamp
  //update dynamodb item with generated task s3 key

  const params = {
    TableName: process.env.TASKS_TABLE,
    Key: {
      PK: event.taskId,
      SK: event.taskId
    },
    UpdateExpression: "set #gen = :gen, #key = :key",
    ExpressionAttributeNames: {
      "#gen" : "lastgenerated",
      "#key" : "taskkey"
    },
    ExpressionAttributeValues: {
      ":gen" : new Date().toISOString(),
      ":key" : event.taskKey
    }
  }

  await DDB.update(params).promise();

  return OK;
};


module.exports = { handler }