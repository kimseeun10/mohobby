// 미들웨어

const { User } = require('../models/User');


let auth = (req, res, next) => {

    //인증처리 하는 곳

    // 1. 클라이언트 세션에서 사용자 식별자 가져오기

    let userId = req.session.userId;

    // 2. 세션에서 사용자 식별자를 사용하여 사용자를 찾는다.
    User.findById(userId)
        .then(user => {
            if (!user) return res.json({ isAuth: false, error: true });
            req.user = user;
            next();
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ isAuth: false, error: true });
        });
};


module.exports = { auth };