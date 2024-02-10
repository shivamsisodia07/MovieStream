import mongoose, { Schema } from "mongoose";

const LikesSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId(),
      ref: "Comment",
    },
    video: {
      type: Schema.Types.ObjectId(),
      ref: "Video",
    },
    likedBy: {
      type: Schema.Types.ObjectId(),
      ref: "User",
    },
    tweets: {
      type: Schema.Types.ObjectId(),
      ref: "Tweets",
    },
  },
  { timestamps: true }
);

export const Likes = mongoose.model("Likes", LikesSchema);
