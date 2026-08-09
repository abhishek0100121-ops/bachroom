require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

const PORT = process.env.PORT || 3000;

const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    "https://abhishek0100121-ops.github.io/bachroom/";

const FRONTEND_ORIGIN =
    new URL(FRONTEND_URL).origin;


/* ================================
   RENDER HTTPS / PROXY
================================ */

app.set("trust proxy", 1);


/* ================================
   MIDDLEWARE
================================ */

app.use(express.json());

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        credentials: true
    })
);


/* ================================
   SESSION
================================ */

app.use(
    session({
        secret:
            process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);


/* ================================
   PASSPORT
================================ */

app.use(passport.initialize());

app.use(passport.session());


/* ================================
   GOOGLE OAUTH STRATEGY
================================ */

passport.use(
    new GoogleStrategy(
        {
            clientID:
                process.env.GOOGLE_CLIENT_ID,

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
                process.env.GOOGLE_CALLBACK_URL
        },

        function (
            accessToken,
            refreshToken,
            profile,
            done
        ) {
            const user = {
                id: profile.id,

                name:
                    profile.displayName || "",

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


/* ================================
   PASSPORT SESSION
================================ */

passport.serializeUser(
    function (user, done) {
        done(null, user);
    }
);

passport.deserializeUser(
    function (user, done) {
        done(null, user);
    }
);


/* ================================
   HOME / HEALTH CHECK
================================ */

app.get("/", function (req, res) {
    res.json({
        success: true,
        message: "Bachroom.com backend is running",
        creator: "Abhishek Mishra"
    });
});


/* ================================
   GOOGLE LOGIN
================================ */

app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);


/* ================================
   GOOGLE CALLBACK
================================ */

app.get(
    "/auth/google/callback",

    passport.authenticate("google", {
        failureRedirect:
            `${FRONTEND_URL}?login=failed`
    }),

    function (req, res) {

        console.log(
            "Google login successful:",
            req.user && req.user.email
        );

        console.log(
            "Saving session..."
        );

        req.session.save(function (err) {

            if (err) {

                console.error(
                    "SESSION SAVE ERROR:",
                    err
                );

                return res.redirect(
                    `${FRONTEND_URL}?login=failed`
                );
            }

            console.log(
                "SESSION SAVED SUCCESSFULLY"
            );

            console.log(
                "Session ID:",
                req.sessionID
            );

            console.log(
                "User:",
                req.user
            );

            return res.redirect(
                `${FRONTEND_URL}?login=success`
            );
        });
    }
);


/* ================================
   CHECK CURRENT LOGIN
================================ */

app.get(
    "/api/me",
    function (req, res) {

        console.log(
            "Checking session..."
        );

        console.log(
            "Session ID:",
            req.sessionID
        );

        console.log(
            "Authenticated:",
            req.isAuthenticated()
        );

        console.log(
            "User:",
            req.user
        );

        if (!req.isAuthenticated()) {

            return res.status(401).json({
                authenticated: false,
                message: "No active session"
            });
        }

        return res.json({
            authenticated: true,

            user: req.user
        });
    }
);


/* ================================
   LOGOUT
================================ */

app.get(
    "/auth/logout",
    function (req, res) {

        req.logout(function (err) {

            if (err) {

                console.error(
                    "LOGOUT ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Logout failed"
                });
            }

            req.session.destroy(function (sessionErr) {

                if (sessionErr) {

                    console.error(
                        "SESSION DESTROY ERROR:",
                        sessionErr
                    );
                }

                res.clearCookie(
                    "connect.sid",
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


/* ================================
   404
================================ */

app.use(
    function (req, res) {

        res.status(404).json({
            success: false,
            message: "Route not found"
        });
    }
);


/* ================================
   START SERVER
================================ */

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

        console.log(
            "Frontend URL:",
            FRONTEND_URL
        );

        console.log(
            "Frontend Origin:",
            FRONTEND_ORIGIN
        );
    }
);
