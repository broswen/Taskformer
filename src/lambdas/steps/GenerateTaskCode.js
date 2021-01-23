'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3();

const handler = async event => {

  const params = {
    Bucket: process.env.DEF_BUCKET,
    Key: event.definitionKey
  }

  let definition;

  try {
    definition = await S3.getObject(params).promise();
  } catch (error) {
    console.log(error);
    throw error;
  }

  console.log(definition);
  console.log(definition.Body.toString('utf-8'));

  const stepFactory = new StepFactory(JSON.parse(definition.Body.toString('utf-8')));

  const generatedCode = stepFactory.generateCode();

  const taskKey = event.definitionKey.replace(".json", ".py");

  const params2 = {
    Bucket: process.env.TASK_BUCKET,
    Key: taskKey,
    Body: Buffer.from(generatedCode)
  }

  try {
    await S3.putObject(params2).promise();  
  } catch (error) {
    console.log(error);
    throw error;
  }

  event.taskKey = taskKey;

  // convert json task definition to python code
  // task is a series of steps
  // each step has a type and parameters

  // types
  // variable: create a variable and set it to a value
  // print: print statement with input
  // calc: evaluate a math expression to an output

// for (let p in variables) {
//   exp = exp.replace(new RegExp(p, "g"), variables[p])
// }

  return event;
};

class StepFactory {
  constructor(definition) {
    this.definition = definition;
    this.steps = [];
    this.createSteps();
  }
  createSteps() {
    for (let step of this.definition.steps) {
      switch(step.type) {
        case "comment":
          this.steps.push(new Comment(step));
          break;
        case "variable":
          this.steps.push(new Variable(step));
          break;
        case "calc":
          this.steps.push(new Calc(step));
          break;
        case "print":
          this.steps.push(new Print(step));
          break;
        default:
          console.log("unknown step type");
          break;
      }
    }
  }
  generateCode() {
    let code = "";
    for (let step of this.steps) {
      code += step.generate();
    }
    return code;
  }
}

class Comment {
  constructor(definition) {
    this.definition = definition;
    if (!this.validate()) throw new Error("Invalid Comment definition");
  }

  validate() {
    if (this.definition.type !== "comment") return false
    if (!this.definition.hasOwnProperty("value")) return false
    return true;
  }

  generate() {
    return `# ${this.definition.value}\n\n`
  }
}

class Variable {
  constructor(definition) {
    this.definition = definition;
    if (!this.validate()) throw new Error("Invalid Variable definition");
  }

  validate() {
    if (this.definition.type !== "variable") return false
    if (!this.definition.hasOwnProperty("name")) return false
    if (!this.definition.hasOwnProperty("value")) return false
    return true;
  }

  generate() {
    return `${this.definition.name} = ${this.definition.value}\n\n`
  }
}

class Calc{
  constructor(definition) {
    this.definition = definition;
    if (!this.validate()) throw new Error("Invalid Calc definition");
  }

  validate() {
    if (this.definition.type !== "calc") return false
    if (!this.definition.hasOwnProperty("output")) return false
    if (!this.definition.hasOwnProperty("expression")) return false
    return true;
  }

  generate() {
    return `${this.definition.output} = ${this.definition.expression}\n\n`
  }
}

class Print{
  constructor(definition) {
    this.definition = definition;
    if (!this.validate()) throw new Error("Invalid Print definition");
  }

  validate() {
    if (this.definition.type !== "print") return false
    if (!this.definition.hasOwnProperty("input")) return false
    return true;
  }

  generate() {
    return `print(${this.definition.input.join(', ')})`
  }
}

module.exports = { handler }