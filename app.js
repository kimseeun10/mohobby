const config = require('./config/key');
const express = require('express');
const ejs = require('ejs');
const bodyparser = require('body-parser');
//  const cookieparser = require('cookie-parser');
const session = require('express-session'); // 세션구현 할 때 사용하는 모듈
const passport = require('passport'); // 사용자 인증/관리하여 세션설정을 위한 모듈
const LocalStrategy = require('passport-local').Strategy; // 로컬방식으로 사용하기 위한 모듈
const app = express();
const port = 3000

const { User } = require("./models/User"); // 모델 스키마 가져오기
const { Board } = require("./models/board");
const { auth } = require("./middleware/auth");

const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));

app.set('view engine', 'ejs');
app.set('views', './views') // 화면상에 보여지는 폴더를 views로 지정

app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
//app.use(cookieparser());

// Express 애플리케이션에 Passport 및 세션 미들웨어 추가
app.use(session({
    secret: '1234', // 세션을 암호화하기 위한 시크릿 키
    resave: false,
    saveUninitialized: true
}));

// Passport 초기화 및 세션 사용 설정
app.use(passport.initialize());
app.use(passport.session());

// Passport 설정
passport.use(new LocalStrategy({
    usernameField: 'email', // 클라이언트로부터 이메일을 받아올 필드명
    passwordField: 'password' // 클라이언트로부터 비밀번호를 받아올 필드명
  },
  async function(email, password, done) {
    try {
      // 이메일로 사용자 조회
      const user = await User.findOne({ email: email });
      if (!user) {
        return done(null, false, { message: '존재하지 않는 이메일입니다.' });
      }
      // 비밀번호 일치 여부 확인
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
      }
      // 인증 성공시 사용자 정보 전달
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Passport 세션 설정
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id })
        .then(user => {
            done(null, user); // 사용자를 찾아서 done(null, user)로 전달
        })
        .catch(err => {
            done(err, null);
        });
});

// 라우팅
app.get('/', (req, res) => {
    // 여기에서 isAuthenticated 변수를 정의하거나 가져와서 전달해야 합니다.
    const isAuthenticated = req.isAuthenticated(); // 현재 사용자가 인증되어 있는지 확인합니다.
    res.render('index', { isAuthenticated }); // isAuthenticated 변수를 템플릿에 전달합니다.
});

app.get('/map', (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    res.render('map', { isAuthenticated }); // ./views/map.ejs
})

app.get('/boardList', async (req, res) => {
    try {
        // 데이터베이스에서 모든 게시글을 가져옵니다.
        const boards = await Board.find().sort({ board_date: -1 });
        const isAuthenticated = req.isAuthenticated();
        res.render('boardList', { boards, isAuthenticated }); // ./views/boardList.ejs에 boards를 전달합니다.
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

// 글 추가
app.get('/board', (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    const name = req.user ? req.user.name : '';
    res.render('board', { isAuthenticated ,name }); // ./views/contact.ejs
});

app.post('/boardAdd', async (req, res) => {
    const { title, contents, name, board_date } = req.body;

    try {
        const name = req.user.name;
        // MongoDB에 새로운 글 정보 저장
        const newBoard = await Board.create({
            title: title,
            contents: contents,
            name: name,
            board_date: board_date
        });

        // 글 등록 성공 시 응답
        res.status(201).send('<script>alert("글 등록 성공"); window.location="/boardList";</script>');
    } catch (error) {
        // 에러 발생 시 에러 응답
        console.error('글 등록 실패:', error);
        res.status(500).redirect('/board');
    }
});

// 게시판 상세페이지 라우트
app.get('/board/:id', async (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    try {
        // URL에서 게시글 ID를 가져오기
        const postId = req.params.id;

        // 데이터베이스에서 해당 ID를 가진 게시글을 조회
        const post = await Board.findById(postId);

        if (!post) {
            return res.status(404).send('게시물을 찾을 수 없습니다.');
        }

        // 게시물을 찾았다면 해당 게시물 상세 페이지를 렌더링
        res.render('boardDetail', { post, isAuthenticated });

    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

// 게시글 수정 페이지
app.get('/boardUpdate/:id', async (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    try {
        // URL에서 게시글 ID를 가져오기
        const postId = req.params.id;

        // 데이터베이스에서 해당 ID를 가진 게시글을 조회
        const post = await Board.findById(postId);

        if (!post) {
            return res.status(404).send('게시물을 찾을 수 없습니다.');
        }

        // 게시물을 찾았다면 해당 게시물 상세 페이지를 렌더링
        res.render('boardUpdate', { post, isAuthenticated });

    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});

app.post('/bUpdate/:id', async (req, res) => {
    const { title, contents } = req.body;
    const postId = req.params.id; // 게시글 ID 가져오기

    try {
        // MongoDB에 해당 ID를 가진 게시글을 찾아 업데이트
        await Board.findByIdAndUpdate(postId, {
            title: title,
            contents: contents
        });

        // 수정 성공 시 메인 페이지로 리다이렉트
        res.status(201).send('<script>alert("게시글 수정 성공"); window.location="/board/' + postId + '";</script>');
    } catch (error) {
        // 에러 발생 시 에러 응답
        console.error('게시글 수정 실패:', error);
        res.status(500).send('서버 오류');
    }
});

app.post('/board/:id/delete', async (req, res) => {
    const postId = req.params.id;

    try {
        // 데이터베이스에서 해당 ID를 가진 게시글을 찾아 삭제
        await Board.findByIdAndDelete(postId);
        res.status(200).send('<script>alert("삭제되었습니다."); window.location="/boardList";</script>')
    } catch (err) {
        console.error(err);
        res.status(500).send('게시글 삭제 실패');
    }
});

// 로그인, 회원가입 구현

app.get('/register', (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    res.render('register', { isAuthenticated }); // ./views/register.ejs -> 회원가입 페이지
})
app.post('/register', async (req, res) => {
    // 클라이언트가 보낸 회원가입 데이터 받아오기
    const { email, password, name, region, dong, image } = req.body;

    try {
        // MongoDB에 새로운 회원 정보 저장
        const newUser = await User.create({
            email: email,
            password: password,
            name: name,
            region: region,
            dong: dong,
            image: image
        });

        // 회원가입 성공 시 응답
        res.status(201).send('<script>alert("회원가입이 완료되었습니다."); window.location="/login";</script>');
    } catch (error) {
        // 에러 발생 시 에러 응답
        console.error('회원가입 실패:', error);
        res.status(500).redirect('/register');
    }
});

app.get('/login', (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    res.render('login', { isAuthenticated });;
})

// 로그인 처리 라우트
app.post('/login', passport.authenticate('local', { 
    successRedirect: '/', // 로그인 성공시 리다이렉트할 경로
    failureRedirect: '/login', // 로그인 실패시 리다이렉트할 경로
    failureFlash: true // 실패 메시지 사용 여부
  }));


app.get('/auth', auth, (req, res) => {
    // 여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication 이 True 라는 말.

    res.status(200).render('index', { isAuthenticated: true });
})

// /auth 엔드포인트에 대한 처리
app.get('/auth', (req, res) => {
    // req.isAuthenticated()를 통해 현재 로그인되어 있는지 확인
    if (req.isAuthenticated()) {
        // 로그인되어 있으면 인증된 상태를 응답으로 보냄
        res.status(200).render('index', { isAuthenticated: true });
    } else {
        // 로그인되어 있지 않으면 비인증 상태를 응답으로 보냄
        res.status(200).render('index', { isAuthenticated: false });
    }
});

// 로그아웃 
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login'); // 로그아웃 후 로그인 페이지로 리다이렉트
    });
});

// 마이페이지
app.get('/mypage', async (req, res) => {
    if (!req.isAuthenticated()) {
        // 로그인되지 않은 사용자는 마이페이지에 접근할 수 없으므로 로그인 페이지로 리다이렉트합니다.
        return res.redirect('/login');
    }

    try {
        // 현재 로그인한 사용자의 id를 가져옵니다.
        const userId = req.user._id;

        // 데이터베이스에서 해당 ID를 가진 사용자를 조회합니다.
        const user = await User.findById(userId);

        // 사용자를 찾은 후 해당 사용자의 마이페이지를 렌더링합니다.
        res.render('mypage', { user, isAuthenticated: true }); // isAuthenticated를 정의하여 템플릿에 전달합니다.
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 오류');
    }
});



app.listen(port, () => {
    console.log(`서버가 실행되었습니다. 접속주소 : http://localhost:${port}`)
})
