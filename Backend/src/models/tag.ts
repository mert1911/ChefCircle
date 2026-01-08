// src/models/Tag.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITag extends Document {
  name: string;
  count: number;
}

const TagSchema = new Schema<ITag>({
  name: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
});

export const Tag: Model<ITag> = mongoose.model<ITag>("Tag", TagSchema);
