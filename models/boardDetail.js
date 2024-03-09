const express = require('express');
const router = express.Router();
const Board = require('../models/board');

// 게시글 상세 페이지 라우트
router.get('/:id', async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).send('게시글을 찾을 수 없습니다.');
        }
        res.render('boardDetail', { board });
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;