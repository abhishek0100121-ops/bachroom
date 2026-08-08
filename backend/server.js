require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy =
    require("passport-google-oauth20").Strategy;


const app = express();


const PORT =
    process.env.PORT || 3000;


/* ==========================================
   RENDER HTTPS / PROXY
========================================== */

app.set(
    "trust proxy",
    1
);


/* ==========================================
   BASIC MIDDLEWARE
========================================== */

app.use(
    express.json()
);


app.use(
    cors({

        origin:
            process.env.FRONTEND_URL,

        credentials:
            true

    })
);


/* ==========================================
   SESSION
========================================== */

app.use(

    session({

        secret:
            process.env.SESSION_SECRET,

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            secure:
                true,

            sameSite:
                "none",

            maxAge:
                24 * 60 * 60 * 1000

        }

    })

);


/* ==========================================
   PASSPORT
========================================== */

app.use(
    passport.initialize()
);


app.use(
    passport.session()
);


/* ==========================================
   GOOGLE OAUTH
========================================== */

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


        function(

            accessToken,
            refreshToken,
            profile,

            done

        ) {

            const user = {

                id:
                    profile.id,

                name:
                    profile.displayName,

                email:
                    profile
                        .emails?.[0]
                        ?.value || "",

                photo:
                    profile
                        .photos?.[0]
                        ?.value || ""

            };


            return done(
                null,
                user
            );

        }

    )

);


/* ==========================================
   SESSION SERIALIZATION
========================================== */

passport.serializeUser(

    function(
        user,
        done
    ) {

        done(
            null,
            user
        );

    }

);


passport.deserializeUser(

    function(
        user,
        done
    ) {

        done(
            null,
            user
        );

    }

);


/* ==========================================
   HEALTH CHECK
========================================== */

app.get(

    "/",

    (req, res) => {

        res.json({

            success:
                true,

            message:
                "Bachroom.com backend is running",

            creator:
                "Abhishek Mishra"

        });

    }

);


/* ==========================================
   START GOOGLE LOGIN
========================================== */

app.get(

    "/auth/google",

    passport.authenticate(

        "google",

        {

            scope: [

                "profile",

                "email"

            ]

        }

    )

);


/* ==========================================
   GOOGLE CALLBACK
========================================== */

app.get(

    "/auth/google/callback",

    passport.authenticate(

        "google",

        {

            failureRedirect:
                `${process.env.FRONTEND_URL}/?login=failed`

        }

    ),


    function(
        req,
        res
    ) {

        /*
           IMPORTANT:

           Save the Passport session completely
           before redirecting to the frontend.
        */

        req.session.save(

            function(err) {

                if (err) {

                    console.error(
                        "Google session save failed:",
                        err
                    );

                    return res.redirect(
                        `${process.env.FRONTEND_URL}/?login=failed`
                    );

                }


                res.redirect(

                    `${process.env.FRONTEND_URL}/?login=success`

                );

            }

        );

    }

);


/* ==========================================
   CURRENT USER
========================================== */

app.get(

    "/api/me",

    (req, res) => {

        /*
           Prevent cached authentication responses.
        */

        res.set(
            "Cache-Control",
            "no-store"
        );


        if (
            !req.isAuthenticated()
        ) {

            return res

                .status(401)

                .json({

                    authenticated:
                        false

                });

        }


        res.json({

            authenticated:
                true,

            user:
                req.user

        });

    }

);


/* ==========================================
   LOGOUT
========================================== */

app.get(

    "/auth/logout",

    (req, res) => {

        req.logout(

            function(err) {

                if (err) {

                    return res

                        .status(500)

                        .json({

                            success:
                                false,

                            message:
                                "Logout failed"

                        });

                }


                req.session.destroy(

                    () => {

                        res.redirect(

                            process.env
                                .FRONTEND_URL

                        );

                    }

                );

            }

        );

    }

);


/* ==========================================
   404
========================================== */

app.use(

    (req, res) => {

        res

            .status(404)

            .json({

                success:
                    false,

                message:
                    "Route not found"

            });

    }

);


/* ==========================================
   SERVER
========================================== */

app.listen(

    PORT,

    () => {

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
