const mongoose = require('mongoose'); // 몽구스 가져오기
const bcrypt = require('bcrypt'); // 비밀번호 암호화
const saltRounds = 10; // salt를 몇글자로 할것인지
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({ 
    // 아이디(이메일), 비밀번호, 이름, 지역, 동네, 권한, 이미지, 토큰, 토큰유효기간

    email: {
        type: String,
        trim: true, // 공백 없애주는 역할
        unique: 1, // 중복 허용x
    },
    password: {
        type: String,
        minlength: 5,
    },
    name: {
        type: String,
        maxlenght: 50,
    },
    region: String,
    dong: String,
    image: String,
    role: {
        type: Number,
        default: 0, // 0은 일반유저, 1은 관리자
    }
});

// save 하기 전 비밀번호를 암호화시킨다.
userSchema.pre('save', function(next){
    // 비밀번호를 바꿀 때만 암호화 시킨다.
    if(this.isModified('password')) {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if(err) return next(err);
            bcrypt.hash(this.password, salt, (err, hash) => {
                if(err) return next(err);
                this.password = hash;
                next();
            });
        });
    } else {
        next();
    }
})

// 로그인 때 암호화된 비밀번호와 암호화 안된 비밀번호를 암호화 시켜 비교
userSchema.methods.comparePassword = function(plainPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainPassword, this.password, (err, isMatch) => {
            if (err) return reject(err);
            resolve(isMatch);
        });
    });
};

const User = mongoose.model("User", userSchema); // 스키마를 모델로 감싸준다.

module.exports = { User }; // 다른 곳에서도 사용가능 하도록 export