import mongoose, { Schema } from "mongoose";

const PlaylistSchema = new Schema(
  {
    name: {
      type: String,
      require: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    videos: {
      type: Schema.Types.ObjectId(),
      ref: "Video",
    },
    owner: {
      types: Schema.Types.ObjectId(),
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", PlaylistSchema);
