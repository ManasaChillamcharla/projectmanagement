import { User } from "../models/User.js";
import { ok, fail } from "../utils/http.js";
import { signToken } from "../utils/tokens.js";

function userPayload(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

export async function register(req, res) {
  const existing = await User.findOne({ email: req.validated.body.email });
  if (existing) return fail(res, "Email is already registered", 409);

  const user = await User.create(req.validated.body);
  return ok(res, { user: userPayload(user), token: signToken(user) }, 201);
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.validated.body.email }).select("+password");
  if (!user || !(await user.comparePassword(req.validated.body.password))) {
    return fail(res, "Invalid email or password", 401);
  }

  return ok(res, { user: userPayload(user), token: signToken(user) });
}

export async function me(req, res) {
  return ok(res, { user: userPayload(req.user) });
}
