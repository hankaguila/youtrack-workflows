const entities = require("@jetbrains/youtrack-scripting-api/entities");

exports.rule = entities.Issue.onChange({
  title: "Update Due In based on Due Date",
  cron: "0 0 0 ? * MON-SUN",

  guard: function (ctx) {
    const logger = new Logger(ctx.traceEnabled);

    function checkStateChanged() {
      return (
        ctx.issue.fields.isChanged(ctx.DueDate) ||
        ctx.issue.fields.isChanged(ctx.DueIn)
      );
    }

    try {
      return checkStateChanged();
    } catch (err) {
      if (err?.message?.includes("has no value")) {
        logger.error("Failed to execute guard", err);
        return false;
      }
      throw err;
    }
  },

  action: function (ctx) {
    const dueDate = ctx.issue.fields.DueDate;

    if (dueDate != null) {
      const now = new Date();

      // Normalize date to midnight
      const normalizeDate = (date) => {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0); // Set time to 00:00:00
        return newDate;
      };

      const normalizedDueDate = normalizeDate(dueDate);
      const normalizedNow = normalizeDate(now);

      const daysFromNow = Math.ceil(
        (normalizedDueDate - normalizedNow) / (1000 * 60 * 60 * 24) // milliseconds -> days
      );

      if (daysFromNow < 0) {
        ctx.issue.fields.DueIn = "Overdue";
      } else if (daysFromNow === 0) {
        ctx.issue.fields.DueIn = "Today";
      } else if (daysFromNow === 1) {
        ctx.issue.fields.DueIn = "Tomorrow";
      } else {
        ctx.issue.fields.DueIn = daysFromNow + "d";
      }
    } else {
      ctx.issue.fields.DueIn = "--";
    }
  },

  requirements: {
    DueDate: {
      name: "Due Date",
      type: entities.Field.dateType
    },
    DueIn: {
      name: "Due In",
      type: entities.Field.stringType
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
