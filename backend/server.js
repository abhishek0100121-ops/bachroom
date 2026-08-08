require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

const PORT = process.env.PORT || 3000;

// ======================================================
// BASIC SETTINGS
// ======================================================

app.set("trust proxy", 1);

app.use(express.json());

// ======================================================
// CORS
// ======================================================

const FRONTEND_URL = (
    process.env.FRONTEND_URL ||
    "https://abhishek0100121-ops.github.io"
).replace(/\/$/, "");

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// ======================================================
// SESSION
// ======================================================

app.use(
    session({
        name: "bachroom.sid",

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        proxy: true,

        cookie: {
            httpOnly: true,

            secure: true,

            sameSite: "none",

            maxAge: 24 * 60 * 60 * 1000,

            // Helps Chrome handle cross-site cookies
            partitioned: true
        }
    })
);

// ======================================================
// PASSPORT
// ======================================================

app.use(passport.initialize());

app.use(passport.session());

// ======================================================
// GOOGLE OAUTH
// ======================================================

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,

            clientSecret: process.env.GOOGLE_CLIENT_SECRET,

            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },

        function (accessToken, refreshToken, profile, done) {

            const user = {
                id: profile.id,

                name: profile.displayName,

                email:
                    profile.emails &&
                    profile.emails[0]
                        ? profile.emails[0].value
                        : "",

                photo:
                    profile.photos &&
                    profile.photos[0]
                        ? profile.photos[0].value
                        : ""
            };

            return done(null, user);
        }
    )
);

// ======================================================
// SERIALIZE USER
// ======================================================

passport.serializeUser(function (user, done) {

    done(null, user);

});

// ======================================================
// DESERIALIZE USER
// ======================================================

passport.deserializeUser(function (user, done) {

    done(null, user);

});

// ======================================================
// HOME / HEALTH CHECK
// ======================================================

app.get("/", function (req, res) {

    res.json({
        success: true,
        message: "Bachroom.com backend is running",
        creator: "Abhishek Mishra"
    });

});

// ======================================================
// GOOGLE LOGIN
// ======================================================

app.get(
    "/auth/google",

    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// ======================================================
// GOOGLE CALLBACK
// ======================================================

app.get(
    "/auth/google/callback",

    passport.authenticate("google", {
        failureRedirect:
            `${FRONTEND_URL}/?login=failed`
    }),

    function (req, res) {

        // Make absolutely sure the session is saved
        // before redirecting to GitHub Pages.

        req.session.save(function (err) {

            if (err) {

                console.error(
                    "SESSION SAVE ERROR:",
                    err
                );

                return res.redirect(
                    `${FRONTEND_URL}/?login=failed`
                );
            }

            console.log(
                "Google login successful:",
                req.user.email
            );

            res.redirect(
                `${FRONTEND_URL}/?login=success`
            );

        });

    }
);

// ======================================================
// CURRENT USER
// ======================================================

app.get(
    "/api/me",

    function (req, res) {

        console.log(
            "Checking session..."
        );

        console.log(
            "Authenticated:",
            req.isAuthenticated()
        );

        if (!req.isAuthenticated()) {

            return res.status(401).json({

                authenticated: false,

                message: "No active session"

            });

        }

        return res.json({

            authenticated: true,

            user: {

                id: req.user.id,

                name: req.user.name,

                email: req.user.email,

                photo: req.user.photo

            }

        });

    }
);

// ======================================================
// LOGOUT
// ======================================================

app.get(
    "/auth/logout",

    function (req, res) {

        req.logout(function (logoutError) {

            if (logoutError) {

                console.error(
                    "LOGOUT ERROR:",
                    logoutError
                );

                return res.status(500).json({

                    success: false,

                    message: "Logout failed"

                });

            }

            req.session.destroy(function (sessionError) {

                if (sessionError) {

                    console.error(
                        "SESSION DESTROY ERROR:",
                        sessionError
                    );

                    return res.status(500).json({

                        success: false,

                        message:
                            "Session destroy failed"

                    });

                }

                res.clearCookie(
                    "bachroom.sid",
                    {
                        httpOnly: true,
                        secure: true,
                        sameSite: "none"
                    }
                );

                return res.redirect(
                    FRONTEND_URL
                );

            });

        });

    }
);

// ======================================================
// 404
// ======================================================

app.use(function (req, res) {

    res.status(404).json({

        success: false,

        message: "Route not found"

    });

});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(function (err, req, res, next) {

    console.error(
        "SERVER ERROR:",
        err
    );

    res.status(500).json({

        success: false,

        message: "Internal server error"

    });

});

// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,

    function () {

        console.log(
            "-----------------------------------"
        );

        console.log(
            "BACHROOM.COM BACKEND"
        );

        console.log(
            "Made by Abhishek Mishra"
        );

        console.log(
            "-----------------------------------"
        );

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
