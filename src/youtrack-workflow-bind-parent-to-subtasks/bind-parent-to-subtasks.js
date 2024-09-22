const entities = require("@jetbrains/youtrack-scripting-api/entities");
const workflow = require("@jetbrains/youtrack-scripting-api/workflow");

function isParent(ctx) {
  return ctx.issue.links["parent for"].size !== 0;
}

function isSubtask(ctx) {
  return ctx.issue.links["subtask of"].size !== 0;
}

function didStateChange(ctx) {
  return ctx.issue.fields.isChanged(ctx.State);
}

// Recursively find the least progressed state of all subtasks
function getLeastProgressedState(issue) {
  const children = issue.links["parent for"];

  if (children.size === 0) {
    return issue.fields.State.ordinal;
  }

  const stateOrdinals = [];
  for (let i = 0; i < children.size; i++) {
    const child = children.get(i);
    stateOrdinals.push(getLeastProgressedState(child));
  }

  return Math.min(...stateOrdinals);
}

function updateState(issue, stateField) {
  const minOrdinal = getLeastProgressedState(issue);
  const stateValue =
    stateField.values.find((value) => value.ordinal === minOrdinal) ??
    issue.fields.State;
  const oldStateValueName = issue.State.name;
  issue.State = stateValue;

  if (oldStateValueName !== stateValue.name) {
    workflow.message(
      `✔ Moved ${issue.id} to ${issue.State.name} per subtasks`
    );
  }
}

exports.rule = entities.Issue.onChange({
  title: "Bind parent state to the least progressed subtask",

  guard: function (ctx) {
    const logger = new Logger(ctx.traceEnabled);
    try {
      return (isParent(ctx) || isSubtask(ctx)) && didStateChange(ctx);
    } catch (err) {
      if (err?.message?.includes("has no value")) {
        logger.error("Failed to execute guard", err);
        return false;
      }
      throw err;
    }
  },

  action: function (ctx) {
    const issue = ctx.issue;
    const parent = issue.links["subtask of"].first();
    const stateField = issue.project.findFieldByName(ctx.State.name);

    if (isParent(ctx)) {
      updateState(issue, stateField);
    }

    if (isSubtask(ctx) && parent) {
      const parentStateField = parent.project.findFieldByName(ctx.State.name);
      updateState(parent, parentStateField);
    }
  },

  requirements: {
    State: {
      type: entities.State.fieldType
    }
  }
});

function Logger(useDebug = true) {
  return {
    log: (...args) => useDebug && console.log(...args),
    warn: (...args) => useDebug && console.warn(...args),
    error: (...args) => useDebug && console.error(...args)
  };
}
