'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const handler = async event => {
  console.log(event);

  // convert json task definition to python code
  // task is a series of steps
  // each step has a type and parameters

  // types
  // variable: create a variable and set it to a value
  // print: print statement with input
  // calc: evaluate a math expression to an output

  return event;
};


module.exports = { handler }