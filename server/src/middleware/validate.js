export function validate(schema, property = "body") {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });
    if (error) {
      return res.status(422).json({
        success:false,
        error:{
          code:"VALIDATION_ERROR",
          message:error.details.map(d => d.message).join("; ")
        }
      });
    }
    req[property] = value;
    next();
  };
}
