import { fail } from "../utils/http.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return fail(res, "Validation failed", 422, result.error.flatten());
    }

    req.validated = result.data;
    next();
  };
}
