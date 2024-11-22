// importing modules from the Appwrite SDK
const { Client, Account, Databases, ID, Query } = Appwrite;
/*
Client: Used to initialize the Appwrite client and set the endpoint and project.
Account: Used to interact with the Appwrite account service (e.g., signing in or registering users).
Databases: Used to interact with the Appwrite database service (for CRUD operations).
ID: Provides utility methods for generating unique IDs (e.g., for documents or collections).
Query: Contains helper methods for creating database queries. 
*/
const projectId = "6735b930000818470050";
const databaseId = "67385eb30011df1d3f14"; // to save scores
const collectionId = "67385ece0007798ff522";
// initializing the Appwrite Client, which will be used to interact with Appwrite's services.
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1") // Appwrite's cloud endpoint
  .setProject(projectId); // setting the project ID for this client
// Creating an account for the client
const account = new Account(client);

// Creating a DB:
const database = new Databases(client);
// check if user is logged in or not
async function isLoggedIn() {
  return account
    .get()
    .then((response) => {
      if (response) {
        //   console.log(response);
        return true;
      }
      return false;
    })
    .catch((error) => console.error(error));
}
// function to display the usrname
function displayUserName() {
  account
    .get()
    .then((response) => {
      const usernameElement = document.getElementById("username");
      usernameElement.textContent = response.name;
    })
    .catch((error) => console.error(error));
}
document.addEventListener("DOMContentLoaded", () => {
  displayUserName();
  showScore();
});

// function to get the user ID
async function getUserID() {
  return account
    .get()
    .then((response) => {
      return response.$id;
    })
    .catch((error) => console.error(error));
}

// function ot update the score
function updateScore(score) {
  const currentHightScore = document.getElementById("highscore").textContent;
  if (Number(score) > Number(currentHightScore)) {
    getUserID().then((userID) => {
      database
        .updateDocument(databaseId, collectionId, userID, {
          userID: userID,
          highscore: score,
        })
        .then(() => {
          showScore();
        })
        .catch((error) => console.error(error));
    });
  }
}
function showScore() {
  getUserID().then((userID) => {
    console.log("userID:", userID);
    database
      .listDocuments(databaseId, collectionId, [Query.equal("userID", userID)])
      .then((response) => {
        const highscoreElement = document.getElementById("highscore");
        console.log(response.documents[0].highscore);

        highscoreElement.textContent = response.documents[0].highscore;
      });
  });
}
function register(event) {
  event.preventDefault();
  account
    .create(
      ID.unique(),
      event.target.elements["register-email"].value,
      event.target.elements["register-password"].value,
      event.target.elements["register-username"].value
    )
    .then((response) => {
      // creating a document in the db
      // createDocument is a methode from Appwrite, specific for creating docs for the db
      // response.$id: oveerisding the document id to be response.$id
      database.createDocument(databaseId, collectionId, response.$id, {
        userID: response.$id,
        highscore: 0,
      });
      account
        .createEmailSession(
          event.target.elements["register-email"].value,
          event.target.elements["register-password"].value
          // once the email session is created, we hide the registration form and display the game
        )
        .then(() => {
          displayUserName();
          showDisplay();
        });
    })
    .catch((error) => console.error(error));
}
function login(event) {
  account
    .createEmailSession(
      event.target.elements["login-email"].value,
      event.target.elements["login-password"].value
    )
    .then(() => {
      alert("Session created successfully!");
      displayUserName();
      showDisplay();
      showScore();
      client.subscribe("account", (response) => {
        console.log(response);
      });
    })
    .catch((error) => console.error(error));
  event.preventDefault();
}
function logout() {
  account
    .deleteSessions()
    .then(() => {
      alert("Logged Out");
      console.log("Current session deleted!");
      showDisplay();
      const highscoreElement = document.getElementById("highscore");
      highscoreElement.textContent = "";
    })
    .catch((error) => {
      alert("Failed to create a session!");
      console.error(error);
    });
}
// function to toggle between the modals: Register & Login
function toggleModal(event) {
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const registerButton = document.getElementById("register-button");
  const loginButton = document.getElementById("login-button");

  if (event.srcElement.id === "register-button") {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    registerButton.classList.remove("not-active");
    loginButton.classList.add("not-active");
  }
  if (event.srcElement.id === "login-button") {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    registerButton.classList.add("not-active");
    loginButton.classList.remove("not-active");
  }
}
// function to hide the modal and display the game
function showDisplay() {
  const modalElement = document.getElementById("modal");
  modalElement.classList.add("hidden");
  isLoggedIn()
    .then((isIn) => {
      if (isIn) {
        const modalElement = document.getElementById("modal");
        modalElement.classList.add("hidden");
        const logOutButton = document.getElementById("logout-button");
        logOutButton.classList.remove("hidden");
        const highScoretag = document.getElementById("highscore-tag");
        highScoretag.classList.remove("hidden");
        startGame();
      } else {
        const modalElement = document.getElementById("modal");
        modalElement.classList.remove("hidden");
        const logOutButton = document.getElementById("logout-button");
        logOutButton.classList.add("hidden");
        const highScoretag = document.getElementById("highscore-tag");
        highScoretag.classList.add("hidden");
        const usernameElement = document.getElementById("username");
        usernameElement.textContent = "";
        const canvas = document.querySelector("canvas");
        if (canvas) canvas.remove();
      }
    })
    .catch((error) => console.error(error));
}

showDisplay();

// Kaboom Game
function startGame() {
  kaboom({
    global: true,
    fullscreen: true,
    scale: 2,
    // change the bg color
    clearColor: [0, 0, 0, 1],
  });

  // speed identifiers
  const moveSpeed = 120;
  const jumpForce = 360;
  const bigJumpForce = 550;
  let currentJumpForce = jumpForce;
  const fallDeath = 400;
  const enemySpeed = 20;

  // GameLogic
  let isJumping = true;

  loadRoot("https://i.imgur.com/");
  loadSprite("coin", "wbKxhcd.png");
  loadSprite("evil-shroom", "KPO3fR9.png");
  loadSprite("brick", "pogC9x5.png");
  loadSprite("block", "M6rwarW.png");
  loadSprite("mario", "Wb1qfhK.png");
  loadSprite("muschroom", "0wMd92p.png");
  loadSprite("surprise", "gesQ1KP.png");
  loadSprite("unboxed", "bdrLpi6.png");
  loadSprite("pipe-top-left", "ReTPiWY.png");
  loadSprite("pipe-top-right", "hj2GK4n.png");
  loadSprite("pipe-bottom-left", "c1cYSbt.png");
  loadSprite("pipe-bottom-right", "nqQ79eI.png");
  loadSprite("blue-block", "fVscIbn.png");
  loadSprite("blue-brick", "3e5YRQd.png");
  loadSprite("blue-steel", "gqVoI2b.png");
  loadSprite("blue-evil-muschroom", "SvV4ueD.png");
  loadSprite("blue-surprise", "RMqCc1G.png");
  // setting the game scene
  // scene is a kaboom method, here we called it game
  scene("game", ({ level, score }) => {
    layers(["bg", "obj", "ui"], "obj");

    const maps = [
      [
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "                                ",
        "    % =*=%=                     ",
        "                                ",
        "                      {}        ",
        "         ^^    ^      ()        ",
        "========================   =====",
      ],
      [
        // seconde map
        "#                                 #",
        "#                                 #",
        "#                                 #",
        "#                                 #",
        "#                                 #",
        "#   !€!€!!               ??       #",
        "#                       ???       #",
        "#               ?      ????     {}#",
        "#        +  +   ?     ?????     ()#",
        "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
      ],
    ];

    // define the configuration

    const levelCfg = {
      width: 20,
      height: 20,
      "=": [sprite("block"), solid()],
      "§": [sprite("coin"), "coin"],
      "%": [sprite("surprise"), solid(), "coin-surprise"],
      "*": [sprite("surprise"), solid(), "mushroom-surprise"],
      "≠": [sprite("unboxed"), solid()],
      "(": [sprite("pipe-bottom-left"), solid(), scale(0.5)],
      ")": [sprite("pipe-bottom-right"), solid(), scale(0.5)],
      "{": [sprite("pipe-top-left"), solid(), scale(0.5), "pipe"],
      "}": [sprite("pipe-top-right"), solid(), scale(0.5), "pipe"],
      "^": [sprite("evil-shroom"), solid(), "dangerous"],
      "°": [sprite("muschroom"), solid(), scale(1), "mushroom", body()],
      "!": [sprite("blue-block"), solid(), scale(0.5)],
      "#": [sprite("blue-brick"), solid(), scale(0.5)],
      "+": [sprite("blue-evil-muschroom"), solid(), scale(0.5), "dangerous"],
      "€": [sprite("blue-surprise"), solid(), scale(0.5), "coin-surprise"],
      "?": [sprite("blue-steel"), solid(), scale(0.5)],
    };

    const gameLevel = addLevel(maps[level], levelCfg);

    // defining the score label
    const scoreLabel = add([
      text(score),
      pos(30, 6),
      layer("ui"),
      {
        value: score,
      },
    ]);

    add([text(" Level " + parseInt(level + 1)), pos(40, 6)]);

    // adding the player (mario)
    const player = add([
      sprite("mario", solid()),
      pos(30, 0),
      body(),
      big(),
      origin("bot"),
    ]);

    // function to deal with mario's size
    function big() {
      let timer = 0;
      let isBig = false;
      return {
        update() {
          if (isBig) {
            currentJumpForce = bigJumpForce;
            timer -= dt(); // dt() comes with kaboom, it handels time
            if (timer <= 0) {
              this.smallify();
            }
          }
        },
        isBig() {
          return isBig;
        },
        smallify() {
          this.scale = vec2(1);
          currentJumpForce = jumpForce;
          timer = 0;
          isBig = false;
        },
        biggify(time) {
          this.scale = vec2(2);
          timer = time;
          isBig = true;
        },
      };
    }

    // show the lose scene if mario falls down
    player.action(() => {
      camPos(player.pos);
      if (player.pos.y >= fallDeath) {
        go("lose", { score: scoreLabel.value });
      }
    });
    // interacting with the pipes =>  go to next level
    player.collides("pipe", () => {
      keyPress("down", () => {
        go("game", {
          level: (level + 1) % maps.length, // added % maps.lenght so the last level takes us to the 1st level
          score: scoreLabel.value,
        });
      });
    });

    //interacting with the surprise boxes
    player.on("headbump", (obj) => {
      if (obj.is("coin-surprise")) {
        gameLevel.spawn("§", obj.gridPos.sub(0, 1));
        destroy(obj);
        gameLevel.spawn("≠", obj.gridPos.sub(0, 0));
      }
      if (obj.is("mushroom-surprise")) {
        gameLevel.spawn("°", obj.gridPos.sub(0, 1));
        destroy(obj);
        gameLevel.spawn("≠", obj.gridPos.sub(0, 0));
      }
    });

    // to make the mushroom move:
    action("mushroom", (m) => {
      m.move(25.0);
    });

    // interacting with the mushroom:
    player.collides("mushroom", (m) => {
      destroy(m);
      player.biggify(5); // biggify does not come with Kaboom, we write it ourselves, 6 is timer
    });

    // interacting with coins
    player.collides("coin", (c) => {
      destroy(c);
      scoreLabel.value++;
      scoreLabel.text = scoreLabel.value;
    });

    // interacting with enemies
    player.collides("dangerous", (d) => {
      if (isJumping) {
        destroy(d);
      } else {
        go("lose", { score: scoreLabel.value });
      }
    });

    // make enemies move
    action("dangerous", (d) => {
      d.move(-enemySpeed, 0);
    });

    // to move mario around
    //moveSpeed(X, Y)
    keyDown("left", () => {
      player.move(-moveSpeed, 0);
    });
    keyDown("right", () => {
      player.move(moveSpeed, 0);
    });

    player.action(() => {
      if (player.grounded()) {
        isJumping = false;
      }
    });

    keyPress("space", () => {
      if (player.grounded()) {
        isJumping = true;
        player.jump(currentJumpForce);
      }
    });
    // case of mario falling
    scene("lose", ({ score }) => {
      add([text(score, 32), origin("center"), pos(width() / 2, height() / 2)]);
      updateScore(score);
    });
  });

  start("game", { level: 0, score: 0 });
}
