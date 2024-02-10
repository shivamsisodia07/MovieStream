import { Router } from "express";
import {
  RegisterUser,
  LoginUser,
  LogOutUser,
  refreshAccessToken,
  ChangePassword,
  updateUserAvatar,
  updateUserCoverImage,
  updateDetails,
  getUserChannelProfile,
  getCurrentUser,
  getUserWatchHistory,
} from "../controllers/user.js";
import { upload } from "../middlewares/multer.js";
import { verifyJwt } from "../middlewares/auth.js";
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

router.route("/login").post(LoginUser);

router.route("/logout").post(verifyJwt, LogOutUser);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJwt, ChangePassword);
router.route("/current-user").post(verifyJwt, getCurrentUser);

router
  .route("/update-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

router
  .route("/update-coverImage")
  .patch(verifyJwt, upload.single("/coverImage"), updateUserCoverImage);

router.route("/update-Account").patch(verifyJwt, updateDetails);

router.route("/c/:username").get(verifyJwt, getUserChannelProfile);

router.route("/history").get(verifyJwt, getUserWatchHistory);
/*
  getUserChannelProfile,
  getUserWatchHistory
*/
export default router;
