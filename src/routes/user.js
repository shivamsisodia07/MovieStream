import { Router } from "express";
import {RegisterUser,LoginUser,LogOutUser} from "../controllers/user.js";
import { upload } from "../middlewares/multer.js";
import {verifyJwt}  from "../middlewares/auth.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  RegisterUser
);

router.route("/login").post(
  LoginUser
)

router.route("/logout").post(
  verifyJwt,
  LogOutUser
)
export default router;
