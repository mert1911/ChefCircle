import express from 'express';
import multer from 'multer';
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likePost,
  addComment,
  deleteComment,
} from '../controllers/post.controller';
import auth from "../middleware/auth";


const router = express.Router();

// configure multer to write uploads into ./uploads
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), auth, createPost);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.delete('/:id', deletePost);
router.post("/:id/like", auth, likePost);
router.post('/:postId/comments', auth, addComment);            // note :postId
router.delete('/:postId/comments/:commentId', auth, deleteComment);

export default router;
