const express = require('express');
const router = express.Router();
const Board = require('../models/board');

// Index Route: 모든 게시글 보기
router.get('/', async (req, res) => {
    try {
        // 데이터베이스에서 모든 게시글을 가져옵니다.
        const boards = await Board.find();
        const isAuthenticated = req.isAuthenticated();
        res.render('boardList', { boards, isAuthenticated }); // ./views/boardList.ejs에 boards를 전달합니다.
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;