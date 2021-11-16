const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const app = express();
const multer = require('multer');
const upload = multer({dest: 'images/'});
const fs = require('fs');

const ONE_DAY_MILLI = 24 * 60 * 60 * 1000;
const ONE_HOUR_MILLI = 60 * 60 * 1000;
const ONE_MINUTE_MILLI = 60 * 1000;
const ONE_SECOND_MILLI = 1000;

var isDebugging = true;

app.use(express.json({ limit : "50mb" }));
app.use(express.urlencoded({ limit:"50mb", extended: false }));

app.listen(3000, function(){
  console.log('application is listeneing on port 3000');
})

const connection = mysql.createConnection({
    //host: "127.0.0.1",
    //user: "myUserName",
    //database: "myDBName",
    //password: "myPassword",
    //port: 3306
});

//회원가입
app.post('/user/join', function (req, res) {
    console.log("app.post called... /user/join");
    console.log(req.body);
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var userName = req.body.userName;
    var userPhone = req.body.userPhone;
    var userSex = req.body.userSex;
    var userBirth = req.body.userBirth;

    // sql 상의 명령어
    var sql = 'INSERT INTO Users (UserEmail, UserPwd, UserName, UserPhone, UserSex, UserBirth) VALUES (?, ?, ?, ?, ?, ?)';
    //sql 명령어의 (?, ?, ?)에 들어갈 데이터
    var params = [userEmail, userPwd, userName, userPhone, userSex, userBirth];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 101;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 100;
            message = '회원가입에 성공했습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//중복확인
app.post('/user/existEmail', function (req, res) {
    console.log("app.post called... /user/existEmail");
    console.log(req.body);
    var userEmail = req.body.userEmail;
    var sql = 'select * from Users where UserEmail = ?';

    connection.query(sql, userEmail, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 301;
                message = '사용 가능한 Email입니다!';
            } else {
                resultCode = 300;
                message = '이미 사용중인 Email입니다!';
            }
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//로그인
app.post('/user/login', function (req, res) {
    console.log("app.post called... /user/login");
    console.log(req.body);

    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var sql = 'select * from Users where UserEmail = ?';

    connection.query(sql, userEmail, function (err, result) {
        var resultCode = 201;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 203;
                message = '존재하지 않는 계정입니다!';
            } else if (userPwd !== result[0].UserPwd) {
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else {
                resultCode = 200;
                message = JSON.stringify(result[0]);
            }
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//비밀번호 수정
app.post('/user/edit/pwd', function (req, res) {
  console.log("app.post called... /user/edit/pwd");
  console.log(req.body);

  var userEmail = req.body.userEmail;
  var userPwd = req.body.userPwd;
  var sql = 'update Users set UserPwd = ? where UserEmail = ?';
  var params = [userPwd, userEmail];

  connection.query(sql, params, function (err, result) {
    var resultCode = 401;
    var message = '에러가 발생했습니다';

    if (err) {
        console.log(err);
    } else {
        resultCode = 400;
        message = '회원정보 수정에 성공했습니다.';
    }

    res.json({
        'code': resultCode,
        'message': message
    });
  })
});

//회원정보 수정
app.post('/user/edit', function (req, res) {
    console.log("app.post called... /user/edit");
    console.log(req.body);

    var userId = req.body.userId;
    var userName = req.body.userName;
    var userPhone = req.body.userPhone;
    var userSex = req.body.userSex;
    var userBirth = req.body.userBirth;

    //Email을 수정하는 기능을 추가하려면, UserEmail이 수정되었을 때 오류를 리턴하는지에 대하 이곳에서 먼저 수행.
    var sql = 'UPDATE Users Set UserName = ?, UserPhone = ?, UserSex = ?, UserBirth = ? WHERE UserID = ?';
    var params = [userName, userPhone, userSex, userBirth, userId];

    connection.query(sql, params, function (err, result) {
        var resultCode = 401;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 400;
            message = '회원정보 수정에 성공했습니다.';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//펫 정보 등록
app.post('/pet/join', function (req, res) {
    console.log("app.post called... /pet/join");
    console.log(req.body);
    const petName = req.body.petName;
    const ownerId = req.body.ownerId;
    const petKG = req.body.petKG;
    const petLB = req.body.petLB;
    const petSex = req.body.petSex;
    const petBirth = req.body.petBirth;
    const device = req.body.device;
    const petSpecies = req.body.petSpecies;
    const registerNum = req.body.registerNum;

    const sql = 'INSERT INTO Pets (PetName, OwnerID, PetKG, PetLB, PetSex, PetBirth, Device, PetSpecies, RegisterNum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [petName, ownerId, petKG, petLB, petSex, petBirth, device, petSpecies, registerNum];

    connection.query(sql, params, function (err, result) {
        var resultCode = 101;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 100;
            message = JSON.stringify(result.insertId);
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//펫 정보 검색
app.post('/pet/find', function (req, res) {
    console.log("app.post called... /pet/find");
    console.log(req.body);
    const userEmail = req.body.ownerId;
    const sql = 'select * from Pets where OwnerID = ?';

    connection.query(sql, userEmail, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) {
                resultCode = 501;
                message = '등록된 펫이 없습니다.';
            } else {
                resultCode = 500;
                var jsonStr = JSON.stringify(result);
                console.log(jsonStr);
                message = jsonStr;
            }
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//펫 정보 수정
app.post('/pet/modify', function (req, res) {
    console.log("app.post called... /pet/modify");
    console.log(req.body);
    const ownerId = Number(req.body.ownerId);
    const petId = Number(req.body.petId);
    const petName = req.body.petName;
    const petKG = Number(req.body.petKG);
    const petLB = Number(req.body.petLB);
    const petSex = req.body.petSex;
    const petBirth = req.body.petBirth;
    const device = req.body.device;
    const petSpecies = req.body.petSpecies;
    const registerNum = req.body.registerNum;

    var sql = 'UPDATE Pets SET PetName = ?, PetKG = ?, PetLB = ?, PetSex = ?, PetBirth = ?, Device = ?, PetSpecies = ?, RegisterNum = ? WHERE PetID = ? AND OwnerID = ?';
    var params = [petName, petKG, petLB, petSex, petBirth, device, petSpecies, registerNum, petId, ownerId];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 901;
        var message = '펫 수정을 실패하였습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 900;
            message = "펫 수정을 성공하였습니다"
        }

        console.log(result);

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//펫 몸무게 수정
app.post('/pet/modify/weight', function (req, res) {
  console.log("app.post called... /pet/modify/weight");
  console.log(req.body);
  const petId = Number(req.body.petId);
  const petKG = Number(req.body.petKG);
  const petLB = Number(req.body.petLB);

  var sql = 'UPDATE Pets SET PetKG = ?, PetLB = ? WHERE PetID = ?';
  var params = [petKG, petLB, petId];

  // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
  connection.query(sql, params, function (err, result) {
      var resultCode = 901;
      var message = '몸무게 수정을 실패하였습니다';

      if (err) {
          console.log(err);
      } else {
          resultCode = 900;
          message = "몸무게 수정을 성공하였습니다"
      }

      res.json({
          'code': resultCode,
          'message': message
      });
  });
});

//펫 삭제
app.post('/pet/delete', function (req, res) {
    console.log("app.post called... /pet/delete");
    console.log(req.body);
    const ownerID = req.body.ownerID;
    const petID = req.body.petID;
    const sql = 'delete from Pets where ownerID = ? AND petID = ?';
    const params = [ownerID, petID];

    connection.query(sql, params, function (err, result) {
        var resultCode = 801;
        var message = '펫을 삭제하지 못하였습니다';

        if (err) {
            console.log(err);
        } else {
          resultCode = 800;
          console.log(result);
          message = '펫 삭제를 성공하였습니다';
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//펫 분석 정보 탐색
app.post('/pet/analysis/year', function (req, res) {
    console.log("app.post called... /pet/analysis/year");
    console.log(req.body);
    const petID = req.body.petID;
    const year = Number(req.body.year);
    //var offset = Number(req.body.offset);
    //iOS에서 offset을 540으로 보냄. 자바에서는 offset을 -540으로 보낼 것 같은데 부호 통일 해야함! 내 프로그램은 -540으로 받는 것을 기준으로 작성됨.
    const offset = 0;

    const divMilliSeconds = makeDivArray(year, offset);

    var params = [petID, 0, 0];

    var sensorResults = [];
    var waterResults = [];

    var sql = 'select * from SensorData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';
    var resultCode = 701;

    //쿼리를 열 두 번 수행하는 것으로 구현
    for(var i=0; i<12; i++){
      var startSec = Math.floor(divMilliSeconds[i] / 1000) + 1;
      var endSec = Math.floor(divMilliSeconds[i+1] / 1000);
      if(isDebugging){
        console.log("debugging...");
        console.log("START_SEC: " + startSec + "      (" + new Date(divMilliSeconds[i]) + ")");
        console.log("END_SEC: " + endSec + "       (" + new Date(divMilliSeconds[i+1]) + ")");
      }

      params[1] = startSec;
      params[2] = endSec;

      var message = '센서 데이터 통합 에러';

      sql = 'select * from SensorData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';

      connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          sensorResults.push(result);
        }
      })

      sql = 'select * from WaterData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';

      connection.query(sql, params, function (err, result) {
        resultCode = 701;
        message = '급수량 데이터 통합 에러';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          waterResults.push(result);
        }

        if(waterResults.length == 12){
          message = avgDataOfYear(sensorResults, waterResults, divMilliSeconds);

          resultCode = 700;

          res.json({
            'code': resultCode,
            'message': message
          });
        }
      })
    } 
});

//펫 분석 정보 탐색
//하루 단위의 데이터를 하나의 객체로 만들어 jsonArray에 담아 리턴한다.
app.post('/pet/analysis/day', function (req, res) {
    console.log("app.post called... /pet/analysis/day");
    console.log(req.body);
    const petID = req.body.petID;
    //startTime millisecond단위(어느 시점부터 검색을 시작할 것인지, startMilliSec가 endMilliSec보다 작은 수!)
    const startMilliSec = Number(req.body.startMilliSec);
    //endTime millisecond단위(어느 시점까지 검색할 것인지)
    const endMilliSec = Number(req.body.endMilliSec);

    //검색을 위해서 전달받은 millisecond변수를 second로 변환
    var startSec = Math.floor(startMilliSec / 1000);
    var endSec = Math.floor(endMilliSec / 1000);

    var sql = 'select * from SensorData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';
    var params = [petID, startSec, endSec];

    var sensorResult;
    var waterResult;

    connection.query(sql, params, function (err, result) {
        var resultCode = 701;
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          sensorResult = result;
          if(isDebugging){
            console.log("debugging...");
            console.log("sensorResult length: " + result.length);
          }
        }
    })

    sql = 'select * from WaterData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';

    connection.query(sql, params, function (err, result) {
        var resultCode = 701;
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          waterResult = result;
          if(isDebugging){
            console.log("debugging...");
            console.log("waterResult length: " + result.length);
          }
        }

        message = analizeDay(sensorResult, waterResult, startMilliSec, endMilliSec);

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//펫 분석 정보 탐색
//한 시간 단위의 데이터를 하나의 객체로 만들어 jsonArray에 담아 리턴한다.
app.post('/pet/analysis/hour', function (req, res) {
    console.log("app.post called... /pet/analysis/hour");
    console.log(req.body);
    const petID = req.body.petID;
    //startTime millisecond단위(어느 시점부터 검색을 시작할 것인지, startMilliSec가 endMilliSec보다 작은 수!)
    const startMilliSec = Number(req.body.startMilliSec);
    //endTime millisecond단위(어느 시점까지 검색할 것인지)
    const endMilliSec = Number(req.body.endMilliSec);

    //검색을 위해서 전달받은 millisecond변수를 second로 변환
    var startSec = Math.floor(startMilliSec / 1000);
    var endSec = Math.floor(endMilliSec / 1000);

    var sql = 'select * from SensorData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';
    var params = [petID, startSec, endSec];

    var sensorResult;
    var waterResult;

    connection.query(sql, params, function (err, result) {
        var resultCode = 701;
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          sensorResult = result;
        }
    })

    sql = 'select * from WaterData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';

    connection.query(sql, params, function (err, result) {
        var resultCode = 701;
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          waterResult = result;
        }

        message = analizeHour(sensorResult, waterResult, startMilliSec, endMilliSec);

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//센서 데이터 저장
app.post('/sensor/send', function (req, res) {
    console.log("app.post called... /sensor/send");
    console.log(req.body);
    const petID = Number(req.body.petID);
    const petLB = Number(req.body.petLB);
    const tick = (Number(req.body.s_tick) + Number(req.body.e_tick))/2;
    const steps = Number(req.body.steps);
    const t_lux = Number(req.body.t_lux);
    const avg_lux = Number(req.body.avg_lux);
    const avg_k = Number(req.body.avg_k);
    const vector_x = Number(req.body.vector_x);
    const vector_y = Number(req.body.vector_y);
    const vector_z = Number(req.body.vector_z);

    var hour = (new Date(tick*1000).getHours()+9) % 24;

    var sunVal = calcSunVal(hour,avg_lux);
    var uvVal = calcUvVal(hour, avg_lux);
    var vitDVal = calcVitDVal(hour, avg_lux);
    var walkVal = calcWalkVal(vector_x, vector_y, vector_z);
    var exerciseVal = calcExerciseVal(vector_x, vector_y, vector_z);
    var restVal = calcRestVal(vector_x, vector_y, vector_z);
    var luxpolVal = calcLuxPollution(hour, avg_lux, avg_k);
    var kalVal = findKcal(petLB, steps);

    var sql = 'INSERT INTO SensorData (PetID, tick, steps, sunVal, uvVal, vitDVal, walkVal, exerciseVal, restVal, luxpolVal, kalVal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    var params = [petID, tick, steps, sunVal, uvVal, vitDVal, walkVal, exerciseVal, restVal, luxpolVal, kalVal];

    connection.query(sql, params, function (err, result) {
      var resultCode = 601;
      var message = '실패';

      if (err) {
          console.log(err.errno)
          if(err.errno==1062){
            console.log("existing data sended error");
          }
      } else {
          resultCode = 600;
          message = "성공"
      }

      res.json({
          'code': resultCode,
          'message': message
      });
    })
});

//급수량 수신
app.post('/water/send', function (req, res) {
    console.log("app.post called... /water/send");
    console.log(req.body);
    const petID = req.body.petID;
    //tick은 millisecond단위(언제 급수 하였는지)
    var tick = req.body.tick;
    tick = Math.floor(tick/1000);
    var waterVal = req.body.waterVal;

    var sql = 'INSERT INTO WaterData (PetID, tick, waterVal) VALUES (?, ?, ?)';
    //sql 명령어의 (?, ?, ?)에 들어갈 데이터
    var params = [petID, tick, waterVal];

    connection.query(sql, params, function (err, result) {
        var resultCode = 1001;
        var message = 'waterSend failure';
        if (err) {
            console.log(err);
        } else {
          resultCode = 1000;
          message = String(waterVal);
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//펫 분석 정보 탐색
app.post('/water/analysis/day', function (req, res) {
    console.log("app.post called... /water/analysis/day");
    console.log(req.body);
    var petID = req.body.petID;
    //frontTime millisecond단위(어느 시점부터 검색을 시작할 것인지)
    var frontTime = req.body.frontTime;
    //rearTime millisecond단위(어느 시점까지 검색할 것인지)
    var rearTime = req.body.rearTime;

    //검색을 위해서 전달받은 millisecond변수를 second로 변환
    var frontSec = Math.floor(frontTime / 1000);
    var rearSec = Math.floor(rearTime / 1000);

    var sql = 'select * from WaterData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';
    var params = [petID, rearSec, frontSec];

    connection.query(sql, params, function (err, result) {
        var resultCode = 701;
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          message = analizeWaterDay(result,rearTime,frontTime);
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

//펫 분석 정보 탐색
app.post('/water/analysis/hour', function (req, res) {
    console.log("app.post called... /water/analysis/hour");
    console.log(req.body);
    var petID = req.body.petID;
    //frontTime millisecond단위(어느 시점부터 검색을 시작할 것인지)
    var frontTime = req.body.frontTime;
    //rearTime millisecond단위(어느 시점까지 검색할 것인지)
    var rearTime = req.body.rearTime;

    //검색을 위해서 전달받은 millisecond변수를 second로 변환
    var frontSec = Math.floor(frontTime / 1000);
    var rearSec = Math.floor(rearTime / 1000);

    var sql = 'select * from WaterData where PetID = ? AND tick BETWEEN ? AND ? ORDER BY tick ASC';
    var params = [petID, rearSec, frontSec];

    connection.query(sql, params, function (err, result) {
        var resultCode = 701;
        var message = '에러가 발생했습니다';
        if (err) {
            console.log(err);
        } else {
          resultCode = 700;
          message = analizeWaterHour(result,rearTime,frontTime);
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    })
});

function avgDataOfYear(sensorResults, waterResults, divMilliSeconds){
  //여기서, 한 달씩 analizeDay를 처리하도록 하고, 그 결과를(결과는 하루치 들의 집합이니까) 평균내서 하나의 객체로 만들어주고 싶다!
  //analizeDay를 재활용하기 위해서는, sensorResult와 waterResult를 한 달 간격으로 잘라줘야 한다.
  //인자로 전달할 start, end 밀리세컨드 들도 주의깊게 전달해야만 한다!
  monthDatas = []
  
  if(isDebugging){
    console.log("debugging...");
    console.log("sensorResults, waterResults length: " + sensorResults.length + ", " + waterResults.length);
  }

  for(var i=0;i<12;i++){
    //analizeDay함수에 빈 배열이 전달되면 무슨 일이 일어나는가?
    monthDatas.push(analizeDay(sensorResults[i], waterResults[i], divMilliSeconds[i] + 1000, divMilliSeconds[i+1]));
  }

  if(isDebugging){
    console.log("debugging...");
    console.log("total monthDatas length: " + monthDatas.length);
  }
  results = []

  //monthDatas가 머임?
  for(var i=0; i<monthDatas.length; i++){
    //monthData는 한 달의 데이터
    const monthData = JSON.parse(monthDatas[i]);
    if(isDebugging){
      console.log("debugging...");
      console.log("monthData length: " + monthData.length);
    }

    results.push(new Object());
    results[i].Time = divMilliSeconds[i] + 1000;
    results[i].SunVal = 0;
    results[i].UvVal = 0.0;
    results[i].VitDVal = 0.0;
    results[i].ExerciseVal = 0;
    results[i].WalkVal = 0;
    results[i].RestVal = 0;
    results[i].StepVal = 0;
    results[i].LuxpolVal = 0.0;
    results[i].KalVal = 0.0;
    results[i].WaterVal = 0;

    var notEmptyLength = 0;

    //현재 monthData(일 별로 합산되어진 데이터들이 존재하는 배열, 길이는 달의 일 수 이다.)
    for(var j=0; j<monthData.length; j++){
      if(monthData[j].isEmpty){
        continue;
      }else{
        notEmptyLength++;
      }
      results[i].SunVal += monthData[j].SunVal;
      results[i].UvVal += monthData[j].UvVal;
      results[i].VitDVal += monthData[j].VitDVal;
      results[i].ExerciseVal += monthData[j].ExerciseVal;
      results[i].WalkVal += monthData[j].WalkVal;
      results[i].RestVal += monthData[j].RestVal;
      results[i].StepVal += monthData[j].StepVal;
      results[i].LuxpolVal += monthData[j].LuxpolVal;
      results[i].KalVal += monthData[j].KalVal;
      results[i].WaterVal += monthData[j].WaterVal;
    }

    if(isDebugging){
      console.log("debugging...");
      console.log(i+"th month's notEmptyLength is: " + notEmptyLength);
    }

    if(notEmptyLength == 0){
      results[i].SunVal = 0;
      results[i].UvVal = 0;
      results[i].VitDVal = 0;
      results[i].ExerciseVal = 0;
      results[i].WalkVal = 0;
      results[i].RestVal = 0;
      results[i].StepVal = 0;
      results[i].LuxpolVal = 0;
      results[i].KalVal = 0;
      results[i].WaterVal = 0;
      if(isDebugging){
        console.log("debugging...");
        console.log(i+"th month is all empty");
      }
    }else{
      results[i].SunVal = Math.ceil(results[i].SunVal / notEmptyLength);
      results[i].UvVal = Math.ceil(results[i].UvVal / notEmptyLength);
      results[i].VitDVal = Math.ceil(results[i].VitDVal / notEmptyLength);
      results[i].ExerciseVal = Math.ceil(results[i].ExerciseVal / notEmptyLength);
      results[i].WalkVal = Math.ceil(results[i].WalkVal / notEmptyLength);
      results[i].RestVal = Math.ceil(results[i].RestVal / notEmptyLength);
      results[i].StepVal = Math.ceil(results[i].StepVal / notEmptyLength);
      results[i].LuxpolVal = Math.ceil(results[i].LuxpolVal / notEmptyLength);
      results[i].KalVal = Math.ceil(results[i].KalVal / notEmptyLength);
      results[i].WaterVal = Math.ceil(results[i].WaterVal / notEmptyLength);
    }
  }

  if(isDebugging){
    console.log("debugging...");
    console.log("results length: " + results.length);
    for(var j=0;j<results.length;j++){
      console.log(j + "th result");
      console.log(results[j]);
    }
  }

  return JSON.stringify(results);
}

//Precondition: endMilliSec와 startMilliSec는 millisecond단위
//Postcondition: 
function analizeDay(sensorData, waterData, startMilliSec, endMilliSec){
  //divMilliSec는 인덱싱을 위한 변수로, startDate보다 23시간 59분 59초 이후의 시간이다.
  var divMilliSec = startMilliSec + ONE_DAY_MILLI - ONE_SECOND_MILLI;

  const days = Math.floor(((endMilliSec + ONE_SECOND_MILLI) - startMilliSec) / ONE_DAY_MILLI);

  var results = [];

  //검색 범위 인덱스
  var sensorIndex=0;
  var waterIndex=0;

  for(var i=0; i<days; i++){
    var divSec = Math.floor(divMilliSec / 1000);

    results.push(new Object());
    results[i].Time = divMilliSec;
    results[i].isEmpty = true;
    results[i].SunVal = 0;
    results[i].UvVal = 0.0;
    results[i].VitDVal = 0.0;
    results[i].ExerciseVal = 0;
    results[i].WalkVal = 0;
    results[i].RestVal = 0;
    results[i].StepVal = 0;
    results[i].LuxpolVal = 0.0;
    results[i].KalVal = 0.0;
    results[i].WaterVal = 0;

    while(sensorIndex < sensorData.length){
      if(sensorData[sensorIndex].tick > divSec){
        break;
      }
      results[i].SunVal += sensorData[sensorIndex].sunVal;
      results[i].UvVal += sensorData[sensorIndex].uvVal;
      results[i].VitDVal += sensorData[sensorIndex].vitDVal;
      results[i].ExerciseVal += sensorData[sensorIndex].exerciseVal;
      results[i].WalkVal += sensorData[sensorIndex].walkVal;
      results[i].RestVal += sensorData[sensorIndex].restVal;
      results[i].StepVal += sensorData[sensorIndex].steps;
      results[i].LuxpolVal += sensorData[sensorIndex].luxpolVal;
      results[i].KalVal += sensorData[sensorIndex].kalVal;
      sensorIndex++;
    }

    while(waterIndex < waterData.length){
      if(waterData[waterIndex].tick > divSec){
        break;
      }
      results[i].WaterVal += waterData[waterIndex].waterVal;
      waterIndex++;
    }

    if(results[i].SunVal != 0 || results[i].UvVal != 0 || results[i].VitDVal != 0 || 
      results[i].ExerciseVal != 0 || results[i].WalkVal != 0 || results[i].RestVal != 0 || 
      results[i].StepVal != 0 || results[i].LuxpolVal != 0.0 || results[i].KalVal != 0.0 || results[i].WaterVal != 0){
      results[i].isEmpty = false;
    }

    divMilliSec += ONE_DAY_MILLI;
  }

  if(isDebugging){
    console.log("debugging...");
    console.log("analizeDay's result length: " + results.length);
  }

  return JSON.stringify(results);
}

//Precondition: endMilliSec와 startMilliSec는 millisecond단위
//Postcondition: 
function analizeHour(sensorData, waterData, startMilliSec, endMilliSec){
  //divMilliSec은 인덱싱을 위한 변수로, startDate보다 59분 59초 이후의 시간이다.
  var divMilliSec = startMilliSec + ONE_HOUR_MILLI - ONE_SECOND_MILLI;

  var hours = Math.floor(((endMilliSec + ONE_SECOND_MILLI) - startMilliSec) / ONE_HOUR_MILLI);

  if(isDebugging){
    console.log("debugging...");
    console.log("hours: " + String(hours));
  }

  var results = [];

  //검색 범위 인덱스
  var sensorIndex=0;
  var waterIndex=0;

  for(var i=0; i<hours; i++){  
    var divSec = Math.floor(divMilliSec / 1000);

    results.push(new Object());
    //한 시간 단위의 데이터에 담기는 시간은 데이터의 시작 MilliSecond로 지정
    results[i].Time = divMilliSec;
    results[i].SunVal = 0;
    results[i].UvVal = 0.0;
    results[i].VitDVal = 0.0;
    results[i].ExerciseVal = 0;
    results[i].WalkVal = 0;
    results[i].RestVal = 0;
    results[i].StepVal = 0;
    results[i].LuxpolVal = 0.0;
    results[i].KalVal = 0.0;
    results[i].WaterVal = 0;

    if(isDebugging){
      console.log("debugging...");
      console.log(i + "th object's Time is : " + divMilliSec);
    }

    while(sensorIndex < sensorData.length){
      if(sensorData[sensorIndex].tick > divSec){
        break;
      }
      results[i].SunVal += sensorData[sensorIndex].sunVal;
      results[i].UvVal += sensorData[sensorIndex].uvVal;
      results[i].VitDVal += sensorData[sensorIndex].vitDVal;
      results[i].ExerciseVal += sensorData[sensorIndex].exerciseVal;
      results[i].WalkVal += sensorData[sensorIndex].walkVal;
      results[i].RestVal += sensorData[sensorIndex].restVal;
      results[i].StepVal += sensorData[sensorIndex].steps;
      results[i].LuxpolVal += sensorData[sensorIndex].luxpolVal;
      results[i].KalVal += sensorData[sensorIndex].kalVal;
      sensorIndex++;
    }

    while(waterIndex < waterData.length){
      if(waterData[waterIndex].tick > divSec){
        break;
      }
      results[i].WaterVal += waterData[waterIndex].waterVal;
      waterIndex++;
    }
    divMilliSec += ONE_HOUR_MILLI;
  }
    
  if(isDebugging){
    console.log("debugging...");
    console.log("analizeHour results length: " + results.length);
  }
  return JSON.stringify(results);
}

//Precondition: hour는 '시'값, avg_lux는 센서데이터 값.
//Postcondition: 오전 7시, 오후 17시 사이의 avg_lux를 리턴(1500, 2000사이의 값만 리턴)
function calcSunVal(hour, avg_lux){
  if(!(hour >= 7 && hour <= 17)){
    return 0;
  }
  if(avg_lux >= 2000){
    return 2000;
  }else if(avg_lux >= 1500){
    return avg_lux;
  }else{
    return 0;
  }
}

//Precondition: hour는 '시'값, avg_lux는 센서데이터 값.
//Postcondition: 오전 10시, 오후 16시 사이의 자외선 점수를 리턴(10시부터 16시 사이에 60000lux달성하면 추합했을때 100점임)
function calcUvVal(hour, avg_lux){
  let UV_CONTENT_RATE = 0.05;
  let UV_CONVERSION_INDEX = 0.0079;
  //( w/m^2 to j/Cm^2변환값)
  let CONVERSION = 10000;

  if(!(hour >= 10 && hour <= 16)){
    return 0;
  }
  if(!(avg_lux >= 2000)){
    return 0;
  }

  return avg_lux * UV_CONTENT_RATE * UV_CONVERSION_INDEX * CONVERSION / 237000 * 100;
}

//Precondition: hour는 '시'값, avg_lux는 센서데이터 값.
//Postcondition: 오전 10시, 오후 16시 사이의 비타민D 합성량을 리턴(단위:IU, 일권장량: 400IU)
function calcVitDVal(hour, avg_lux){
  if(!(hour >= 10 && hour <= 16)){
    return 0;
  }
  return avg_lux / 60000 * 400;
}

//Precondition: vector는 센서데이터 값.
//Postcondition: 해당 10분  데이터가 산책상태였으면 10, 아니면 0 리턴
function calcWalkVal(vector_x, vector_y, vector_z){
  if(vector_y + vector_z > vector_x){
    return 10;
  }
  return 0;
}

//Precondition: vector는 센서데이터 값.
//Postcondition: 해당 10분  데이터가 운동상태였으면 10, 아니면 0 리턴
function calcExerciseVal(vector_x, vector_y, vector_z){
  if(vector_y +vector_z < vector_x){
    return 10;
  }
  return 0;
}

//Precondition: vector는 센서데이터 값.
//Postcondition: 해당 10분  데이터가 휴식상태였으면 10, 아니면 0 리턴
function calcRestVal(vector_x, vector_y, vector_z){
  if(vector_x==0 && vector_y==0 && vector_z==0){
    return 10;
  }
  return 0;
}

//Precondition: hour는 '시'값, avg_lux, avg_k는 센서데이터 값.
//Postcondition: 빛 공해 점수를 리턴(점수가 높을 수록 공해를 받지 않은 것.만점이 100)
function calcLuxPollution(hour, avg_lux, avg_k){
  if(!(hour >= 0 && hour <= 5)){
    return 0;
  }
  var luxIndex = 0;
  var kelvinIndex = 0;

  if(avg_lux<=100){ luxIndex = 1.4; }
  if(avg_k<=4000){ kelvinIndex = 1.4; }

  return luxIndex + kelvinIndex;
}

//Precondition: (0<lb<120), (0<step<30000)
//Postcondition: lb와 step을 입력받아, lb는 5단위 버림, step은 100의 단위 버립으로 변환 후,
//               엑셀 파일에서 해당되는 kcal수를 리턴한다.
function findKcal(_lb, _step){
  let workbook = xlsx.readFile(__dirname + "/kcal.xlsx");
  let worksheet = workbook.Sheets["kcal"];
  //lb를 5단위로 버림
  var lb = Math.floor(_lb/5)*5;
  if(lb === 0){
    lb = 5;
  }

  var lb_index = (lb/5)+1;
  var step_index = Math.floor(_step/1000);
  var restStep = _step%1000;
  var next_index;

  if(lb_index>25){lb_index=25;}
  if(step_index>30){step_index=30;}

  //lb, step에 맞는 엑셀 데이터의 위치 지정
  if (step_index===0){
    step_index="B";
    var result = worksheet[step_index+String(lb_index)].w;
    return Number(result/1000*restStep);
  }
  else if(step_index===1){step_index="B";next_index="C";}else if(step_index===2){step_index="C";next_index="D";}
  else if(step_index===3){step_index="D";next_index="E";}else if(step_index===4){step_index="E";next_index="F";}
  else if(step_index===5){step_index="F";next_index="G";}else if(step_index===6){step_index="G";next_index="H";}
  else if(step_index===7){step_index="H";next_index="I";}else if(step_index===8){step_index="I";next_index="J";}
  else if(step_index===9){step_index="J";next_index="K";}else if(step_index===10){step_index="K";next_index="L";}
  else if(step_index===11){step_index="L";next_index="M";}else if(step_index===12){step_index="M";next_index="N";}
  else if(step_index===13){step_index="N";next_index="O";}else if(step_index===14){step_index="O";next_index="P";}
  else if(step_index===15){step_index="P";next_index="Q";}else if(step_index===16){step_index="Q";next_index="R";}
  else if(step_index===17){step_index="R";next_index="S";}else if(step_index===18){step_index="S";next_index="T";}
  else if(step_index===19){step_index="T";next_index="U";}else if(step_index===20){step_index="U";next_index="V";}
  else if(step_index===21){step_index="V";next_index="W";}else if(step_index===22){step_index="W";next_index="X";}
  else if(step_index===23){step_index="X";next_index="Y";}else if(step_index===24){step_index="Y";next_index="Z";}
  else if(step_index===25){step_index="Z";next_index="AA";}else if(step_index===26){step_index="AA";next_index="AB";}
  else if(step_index===27){step_index="AB";next_index="AC";}else if(step_index===28){step_index="AC";next_index="AD";}
  else if(step_index===29){step_index="AD";next_index="AE";}else if(step_index===30){step_index="AE";next_index="AE";}

  var result = Number(worksheet[step_index+String(lb_index)].w)
  + Number((worksheet[next_index+String(lb_index)].w - worksheet[step_index+String(lb_index)].w)*restStep/1000);
  return result;
}

//Precondition: data는 WaterData테이블의 정보가 담긴 데이터임. rearTime과 frontTime은 millisecond단위.
//Postcondition: data를 rearTime부터 frontTime까지 기간동안 하루크기씩 잘라서 JSONArray로 가공해 리턴.
function analizeWaterDay(data,rearTime,frontTime){
  var rearDate = new Date(rearTime);
  var frontDate = new Date(frontTime);
  var divDate = new Date(rearTime);
  divDate.setTime(divDate.getTime() + ONE_DAY_MILLI);

  var days = Math.floor((frontDate.getTime() - rearDate.getTime()) / (ONE_DAY_MILLI + 1000));

  var results = [];

  //검색 범위 인덱스
  var index=0;

  for(var i=0; i<days; i++){
    var r_sec = Math.floor(rearDate.getTime()/1000);
    var d_sec = Math.floor(divDate.getTime()/1000);

    results.push(new Object());
    results[i].Time = divDate.getTime();
    results[i].WaterVal = 0;

    while(index <= data.length){
      if(index == data.length || data[index].tick > d_sec){
        break;
      }
      results[i].WaterVal += data[index].waterVal;
      index++;
    }
  }
  rearDate.setTime(rearDate.getTime() + ONE_DAY_MILLI);
  divDate.setTime(divDate.getTime() + ONE_DAY_MILLI);

  //results를 JSONArray형식으로 만들어 리턴.
  console.log(JSON.stringify(results));
  return JSON.stringify(results);
}

//Precondition: data는 WaterData테이블의 정보가 담긴 데이터임. rearTime과 frontTime은 millisecond단위.
//Postcondition: data를 rearTime부터 frontTime까지 기간동안 한시간씩 잘라서 JSONArray로 가공해 리턴.
function analizeWaterHour(data,rearTime,frontTime){
  var rearDate = new Date(rearTime);
  var frontDate = new Date(frontTime);
  var divDate = new Date(rearTime);
  divDate.setTime(divDate.getTime()+ONE_HOUR_MILLI);

  var hours = Math.floor((frontDate.getTime() - rearDate.getTime()) / (ONE_HOUR_MILLI+1000));

  var results = [];

  //검색 범위 인덱스
  var index=0;

  for(var i=0; i<hours; i++){
    var r_sec = Math.floor(rearDate.getTime()/1000);
    var d_sec = Math.floor(divDate.getTime()/1000);

    results.push(new Object());
    results[i].Time = divDate.getTime();
    results[i].WaterVal = 0;

    while(index <= data.length){
      if(index == data.length || data[index].tick > d_sec){
        break;
      }
      results[i].WaterVal += data[index].waterVal;
      index++;
    }
  }
  rearDate.setTime(rearDate.getTime() + ONE_HOUR_MILLI);
  divDate.setTime(divDate.getTime() + ONE_HOUR_MILLI);

    //results를 JSONArray형식으로 만들어 리턴.
    console.log(JSON.stringify(results));
    return JSON.stringify(results);
}

///Precondition: offset은 분 단위
//Postcondition: 입력 받은 year을 분석하기 위한 divMilliseconds를 offset을 고려해준 값으로 array에 담아 리턴.
function makeDivArray(year, offset){
  var array = []
  var date = new Date();
  
  //year의 작년 12월 31일 23시 59분 59초가 첫 요소,
  //모든 달의 마지막 시간 (마지막 날, 23시 59분 59초)을 배열에 추가
  date.setHours(23,59,59);
  for(var i=0;i<13;i++){
      date.setFullYear(year,i,0);
      array.push(date.getTime());
  }
  
  //offset만큼 시간을 이동시킴.
  for(var i=0; i<array.length; i++){
      array[i] -= offset * ONE_MINUTE_MILLI;
  }

  return array;
}