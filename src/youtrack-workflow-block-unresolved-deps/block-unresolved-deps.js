const entities = require("@jetbrains/youtrack-scripting-api/entities");
const workflow = require("@jetbrains/youtrack-scripting-api/workflow");

exports.rule = entities.Issue.onChange({
  guard: (ctx) => {
    return (
      ctx.issue.becomesResolved && ctx.issue.links["depends on"].isNotEmpty()
    );
  },

  action: (ctx) => {
    ctx.issue.links["depends on"].forEach(function (dep) {
      if (!dep.project.isArchived && dep.isReported) {
        workflow.check(
          dep.isResolved,
          "Cannot resolve, depends on {0}",
          dep.id
        );
      }
    });
  },

  requirements: {
    State: {
      type: entities.State.fieldType
    },

    Depend: {
      type: entities.IssueLinkPrototype,
      outward: "is required for",
      inward: "depends on"
    }
  }
});
