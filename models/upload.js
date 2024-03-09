const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');

// 이미지를 저장할 경로 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// 이미지를 업로드할 미들웨어 생성
const upload = multer({ storage: storage });

// 프로필 이미지 업로드 라우트
router.post('/upload', upload.single('profileImage'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }
        // 사용자 모델에 프로필 이미지 경로 저장
        user.profileImage = req.file.path;
        await user.save();
        res.status(200).send('프로필 이미지가 업로드되었습니다.');
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

module.exports = router;