import mongoose, { Schema } from "mongoose";

const TweetsSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId(),
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
      required: true
    },
  },
  { timestamps: true }
);

export const Tweets = mongoose.model("Tweets", TweetsSchema);
