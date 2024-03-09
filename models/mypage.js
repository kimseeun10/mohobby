const express = require('express');
const router = express.Router();
const User = require('./User');

router.get('/mypage/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }
        // 프로필 이미지 경로를 가져와서 마이페이지에 전달
        res.render('mypage', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});


module.exports = router;