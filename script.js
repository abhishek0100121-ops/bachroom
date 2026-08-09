/* =========================================================
   BACHROOM.COM
   JavaScript
   Made by Abhishek Mishra
========================================================= */

/* =========================================================
   CONFIGURATION
========================================================= */

const BACKEND_URL =
    "https://bachroom-backend.onrender.com";

const ADMIN_PASSWORD =
    "Abhishek@299";


/* =========================================================
   GLOBAL STATE
========================================================= */

let properties =
    JSON.parse(
        localStorage.getItem(
            "bachroom_properties"
        )
    ) || [];

let currentUser =
    JSON.parse(
        localStorage.getItem(
            "bachroom_user"
        )
    ) || null;

let isPremium =
    localStorage.getItem(
        "bachroom_premium"
    ) === "true";

let selectedProperty = null;

let uploadedImages = [];

let toastTimer;


/* =========================================================
   INITIALIZATION
========================================================= */

window.addEventListener(
    "load",
    function () {

        setTimeout(
            function () {

                const loader =
                    document.getElementById(
                        "loader"
                    );

                if (loader) {

                    loader.classList.add(
                        "hide"
                    );

                }

            },
            900
        );

        updatePropertyStats();

        updatePremiumUI();

        /*
           IMPORTANT:
           Do NOT trust localStorage as Google authentication.
           Backend session is checked after OAuth callback.
        */

        checkGoogleLogin();

    }
);


/* =========================================================
   PAGE CONTROL
========================================================= */

function hideAllPages() {

    document
        .querySelectorAll(".page")
        .forEach(
            function (page) {

                page.classList.remove(
                    "active-page"
                );

            }
        );

}


function showPage(id) {

    hideAllPages();

    const page =
        document.getElementById(id);

    if (page) {

        page.classList.add(
            "active-page"
        );

    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   LOGIN NAVIGATION
========================================================= */

function goToLogin() {

    showPage(
        "loginPage"
    );

}


function showCustomerLogin() {

    showPage(
        "customerLoginPage"
    );

}


function showAdminLogin() {

    showPage(
        "adminLoginPage"
    );

    setTimeout(
        function () {

            const password =
                document.getElementById(
                    "adminPassword"
                );

            if (password) {

                password.focus();

            }

        },
        250
    );

}


/* =========================================================
   REAL GOOGLE LOGIN
========================================================= */

function customerLogin() {

    /*
       NEVER accept a Gmail address from an input.

       Authentication is performed by Google.
    */

    window.location.href =
        `&{BACKEND_URL}/auth/google`;

}


function googleLogin() {

    customerLogin();

}


/* =========================================================
   GOOGLE OAUTH CALLBACK
========================================================= */

async function checkGoogleLogin() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const login =
        params.get("login");


    /*
       Normal page load.
    */

    if (!login) {

        return;

    }


    /*
       OAuth failed.
    */

    if (login === "failed") {

        currentUser = null;

        localStorage.removeItem(
            "bachroom_user"
        );

        cleanLoginQuery();

        showPage(
            "loginPage"
        );

        showToast(
            "Google login failed. Please try again."
        );

        return;

    }


    /*
       Only continue for successful OAuth callback.
    */

    if (login !== "success") {

        return;

    }


    try {

        /*
           Ask backend whether the Google session
           really exists.
        */

        const response =
            await fetch(
                `${BACKEND_URL}/api/me`,
                {
                    method: "GET",

                    credentials: "include",

                    cache: "no-store",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Session verification failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.authenticated ||
            !data.user
        ) {

            throw new Error(
                "Backend did not return an authenticated user."
            );

        }


        /*
           Store only the user information returned
           by the verified backend session.
        */

        currentUser = {

            id:
                data.user.id || "",

            name:
                data.user.name ||
                "Google User",

            email:
                data.user.email || "",

            photo:
                data.user.photo || "",

            loginDate:
                new Date().toISOString()

        };


        localStorage.setItem(
            "bachroom_user",
            JSON.stringify(
                currentUser
            )
        );


        cleanLoginQuery();


        showCustomerDashboard();


        showToast(
            `Welcome, ${currentUser.name}!`
        );


    } catch (error) {

        console.error(
            "Google OAuth verification error:",
            error
        );


        currentUser = null;


        localStorage.removeItem(
            "bachroom_user"
        );


        cleanLoginQuery();


        showPage(
            "loginPage"
        );


        showToast(
            "Google session could not be verified. Please try again."
        );

    }

}


/* =========================================================
   CLEAN OAUTH URL
========================================================= */

function cleanLoginQuery() {

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );

}


/* =========================================================
   STORED SESSION
========================================================= */

function showStoredSession() {

    /*
       Intentionally empty.

       localStorage alone must NOT authenticate a user.

       Real authentication comes from /api/me.
    */

}


/* =========================================================
   CUSTOMER DASHBOARD
========================================================= */

function showCustomerDashboard() {

    if (!currentUser) {

        showPage(
            "loginPage"
        );

        return;

    }


    showPage(
        "customerDashboard"
    );


    updateUserGreeting();

    renderProperties();

    updatePropertyStats();

    updatePremiumUI();

}


function updateUserGreeting() {

    const element =
        document.getElementById(
            "userGreeting"
        );


    if (!element) {

        return;

    }


    if (
        currentUser &&
        currentUser.name
    ) {

        element.textContent =
            `Hi, ${currentUser.name}`;

    } else {

        element.textContent =
            "";

    }

}


/* =========================================================
   ADMIN LOGIN
========================================================= */

function adminLogin() {

    const input =
        document.getElementById(
            "adminPassword"
        );

    const password =
        input
            ? input.value
            : "";


    if (!password) {

        showToast(
            "Please enter admin password."
        );

        return;

    }


    if (
        password !==
        ADMIN_PASSWORD
    ) {

        showToast(
            "Incorrect admin password."
        );

        return;

    }


    localStorage.setItem(
        "bachroom_admin",
        "true"
    );


    if (input) {

        input.value = "";

    }


    showToast(
        "Admin login successful."
    );


    setTimeout(
        function () {

            showAdminDashboard();

        },
        400
    );

}


function showAdminDashboard() {

    showPage(
        "adminDashboard"
    );

    renderAdminProperties();

    updateAdminStats();

}


function togglePassword() {

    const input =
        document.getElementById(
            "adminPassword"
        );


    if (!input) {

        return;

    }


    if (
        input.type === "password"
    ) {

        input.type = "text";

    } else {

        input.type = "password";

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    currentUser = null;

    localStorage.removeItem(
        "bachroom_user"
    );

    localStorage.removeItem(
        "bachroom_admin"
    );


    try {

        await fetch(
            `${BACKEND_URL}/auth/logout`,
            {
                method: "GET",

                credentials: "include",

                cache: "no-store"
            }
        );

    } catch (error) {

        console.warn(
            "Backend logout request failed:",
            error
        );

    }


    showToast(
        "Logged out successfully."
    );


    setTimeout(
        function () {

            showPage(
                "loginPage"
            );

        },
        300
    );

}


/* =========================================================
   PROPERTY PHOTO PREVIEW
========================================================= */

function previewPhotos() {

    const input =
        document.getElementById(
            "propertyPhotos"
        );

    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (
        !input ||
        !preview
    ) {

        return;

    }


    uploadedImages = [];

    preview.innerHTML = "";


    if (
        input.files.length < 2
    ) {

        showToast(
            "Please select at least 2 photos."
        );

        return;

    }


    if (
        input.files.length > 10
    ) {

        showToast(
            "Maximum 10 photos are allowed."
        );

        input.value = "";

        return;

    }


    Array
        .from(input.files)
        .forEach(
            function (file) {

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    return;

                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        uploadedImages.push(
                            event.target.result
                        );


                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            "preview-image";


                        const img =
                            document.createElement(
                                "img"
                            );


                        img.src =
                            event.target.result;

                        img.alt =
                            "Property photo";


                        div.appendChild(
                            img
                        );


                        preview.appendChild(
                            div
                        );

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

}


/* =========================================================
   PROPERTY UPLOAD
========================================================= */

function uploadProperty(event) {

    event.preventDefault();


    const title =
        getInputValue(
            "propertyTitle"
        );

    const type =
        getInputValue(
            "propertyType"
        );

    const price =
        Number(
            getInputValue(
                "propertyPrice"
            )
        );

    const location =
        getInputValue(
            "propertyLocation"
        );

    const address =
        getInputValue(
            "propertyAddress"
        );

    const phone =
        getInputValue(
            "propertyPhone"
        );

    const photos =
        document.getElementById(
            "propertyPhotos"
        );


    if (
        !title ||
        !type ||
        !price ||
        !location ||
        !address ||
        !phone
    ) {

        showToast(
            "Please fill all required fields."
        );

        return;

    }


    if (
        !photos ||
        photos.files.length < 2
    ) {

        showToast(
            "Please upload at least 2 photos."
        );

        return;

    }


    if (
        photos.files.length > 10
    ) {

        showToast(
            "Maximum 10 photos are allowed."
        );

        return;

    }


    if (
        uploadedImages.length < 2
    ) {

        showToast(
            "Please wait for photos to finish loading."
        );

        return;

    }


    const property = {

        id:
            Date.now(),

        title,

        type,

        price,

        location,

        address,

        phone,

        images:
            [...uploadedImages],

        createdAt:
            new Date().toISOString()

    };


    properties.unshift(
        property
    );


    saveProperties();


    const form =
        document.getElementById(
            "propertyForm"
        );


    if (form) {

        form.reset();

    }


    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (preview) {

        preview.innerHTML = "";

    }


    uploadedImages = [];


    renderAdminProperties();

    updateAdminStats();

    updatePropertyStats();


    showToast(
        "Rental property published successfully!"
    );

}


/* =========================================================
   PROPERTY STORAGE
========================================================= */

function saveProperties() {

    try {

        localStorage.setItem(
            "bachroom_properties",
            JSON.stringify(
                properties
            )
        );

    } catch (error) {

        console.error(
            "Property storage error:",
            error
        );

        showToast(
            "Storage limit reached. Try smaller photos."
        );

    }

}


function getInputValue(id) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : "";

}


/* =========================================================
   ADMIN PROPERTY LIST
========================================================= */

function renderAdminProperties() {

    const container =
        document.getElementById(
            "adminPropertyList"
        );


    if (!container) {

        return;

    }


    if (!properties.length) {

        container.innerHTML = `

            <div class="empty-state"
                 style="display:block;">

                <div>
                    🏠
                </div>

                <h3>
                    No properties uploaded yet
                </h3>

                <p>
                    Publish your first rental property above.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    properties.forEach(
        function (property) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "admin-property-item";


            const image =
                property.images &&
                property.images.length
                    ? property.images[0]
                    : "";


            item.innerHTML = `

                ${
                    image
                    ?
                    `
                    <img
                        src="${image}"
                        alt="${escapeHTML(property.title)}"
                    >
                    `
                    :
                    `
                    <div class="admin-property-placeholder">
                        🏠
                    </div>
                    `
                }

                <div class="admin-property-details">

                    <strong>
                        ${escapeHTML(
                            property.title
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            property.location
                        )}
                        • ₹${Number(
                            property.price
                        ).toLocaleString("en-IN")}
                        /month
                    </span>

                    <span>
                        ${escapeHTML(
                            property.type
                        )}
                    </span>

                </div>

                <button
                    class="delete-btn"
                    onclick="deleteProperty(${property.id})"
                    type="button"
                >
                    🗑
                </button>

            `;


            container.appendChild(
                item
            );

        }
    );

}


function deleteProperty(id) {

    if (
        !confirm(
            "Delete this rental property?"
        )
    ) {

        return;

    }


    properties =
        properties.filter(
            function (property) {

                return property.id !== id;

            }
        );


    saveProperties();

    renderAdminProperties();

    updateAdminStats();

    updatePropertyStats();


    showToast(
        "Property deleted."
    );

}


/* =========================================================
   CUSTOMER PROPERTIES
========================================================= */

function renderProperties(
    list = properties
) {

    const grid =
        document.getElementById(
            "propertyGrid"
        );

    const empty =
        document.getElementById(
            "noProperties"
        );

    const count =
        document.getElementById(
            "resultCount"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML = "";


    if (!list.length) {

        if (empty) {

            empty.style.display =
                "block";

        }

        if (count) {

            count.textContent =
                "0 properties";

        }

        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    if (count) {

        count.textContent =
            `${list.length} properties`;

    }


    list.forEach(
        function (property, index) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "property-card";


            card.style.animationDelay =
                `${index * 0.05}s`;


            const firstImage =
                property.images &&
                property.images.length
                    ? property.images[0]
                    : "";


            card.innerHTML = `

                <div class="property-image">

                    ${
                        firstImage
                        ?
                        `
                        <img
                            src="${firstImage}"
                            alt="${escapeHTML(
                                property.title
                            )}"
                        >
                        `
                        :
                        `
                        <div
                            style="
                                width:100%;
                                height:100%;
                                display:grid;
                                place-items:center;
                                font-size:60px;
                            "
                        >
                            🏠
                        </div>
                        `
                    }

                    <div class="property-type-badge">
                        ${escapeHTML(
                            property.type
                        )}
                    </div>

                    <div class="property-lock">
                        🔒
                    </div>

                </div>


                <div class="property-info">

                    <h3>
                        ${escapeHTML(
                            property.title
                        )}
                    </h3>

                    <div class="property-location">
                        📍
                        ${escapeHTML(
                            property.location
                        )}
                    </div>


                    <div class="property-bottom">

                        <div class="property-price">

                            ₹${Number(
                                property.price
                            ).toLocaleString("en-IN")}

                            <small>
                                /month
                            </small>

                        </div>


                        <button
                            class="view-btn"
                            onclick="openProperty(${property.id})"
                            type="button"
                        >
                            View →
                        </button>

                    </div>

                </div>

            `;


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   FILTER
========================================================= */

function filterProperties() {

    const locationInput =
        document.getElementById(
            "searchLocation"
        );

    const typeInput =
        document.getElementById(
            "searchType"
        );

    const priceInput =
        document.getElementById(
            "searchPrice"
        );


    const location =
        locationInput
            ? locationInput.value
                .toLowerCase()
                .trim()
            : "";


    const type =
        typeInput
            ? typeInput.value
            : "";


    const maxPrice =
        priceInput
            ? priceInput.value
            : "";


    const filtered =
        properties.filter(
            function (property) {

                const matchesLocation =
                    !location ||
                    String(
                        property.location
                    )
                        .toLowerCase()
                        .includes(location) ||
                    String(
                        property.title
                    )
                        .toLowerCase()
                        .includes(location);


                const matchesType =
                    !type ||
                    property.type === type;


                const matchesPrice =
                    !maxPrice ||
                    Number(
                        property.price
                    ) <= Number(
                        maxPrice
                    );


                return (
                    matchesLocation &&
                    matchesType &&
                    matchesPrice
                );

            }
        );


    renderProperties(
        filtered
    );

}


/* =========================================================
   PROPERTY MODAL
========================================================= */

function openProperty(id) {

    selectedProperty =
        properties.find(
            function (property) {

                return property.id === id;

            }
        );


    if (!selectedProperty) {

        return;

    }


    const type =
        document.getElementById(
            "modalType"
        );

    const type2 =
        document.getElementById(
            "modalType2"
        );

    const title =
        document.getElementById(
            "modalTitle"
        );

    const price =
        document.getElementById(
            "modalPrice"
        );

    const address =
        document.getElementById(
            "modalAddress"
        );

    const images =
        document.getElementById(
            "modalImages"
        );

    const modal =
        document.getElementById(
            "propertyModal"
        );


    if (type) {

        type.textContent =
            selectedProperty.type;

    }


    if (type2) {

        type2.textContent =
            selectedProperty.type;

    }


    if (title) {

        title.textContent =
            selectedProperty.title;

    }


    if (price) {

        price.textContent =
            `₹${Number(
                selectedProperty.price
            ).toLocaleString(
                "en-IN"
            )}/month`;

    }


    if (address) {

        address.textContent =
            isPremium
                ? selectedProperty.address
                : "Premium access required";

    }


    if (images) {

        images.innerHTML = "";


        const propertyImages =
            selectedProperty.images || [];


        propertyImages.forEach(
            function (image) {

                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    image;


                img.alt =
                    selectedProperty.title;


                images.appendChild(
                    img
                );

            }
        );

    }


    if (modal) {

        modal.classList.add(
            "show"
        );

    }


    updateContactSection();

}


/* =========================================================
   CONTACT SECTION
========================================================= */

function updateContactSection() {

    const box =
        document.querySelector(
            ".premium-contact-box"
        );


    if (
        !box ||
        !selectedProperty
    ) {

        return;

    }


    if (isPremium) {

        box.innerHTML = `

            <div class="premium-lock">
                ☎️
            </div>

            <h3>
                Owner Contact
            </h3>

            <p>
                You have Premium access.
            </p>

            <div style="
                margin:15px 0;
                padding:15px;
                background:white;
                border-radius:13px;
            ">

                <strong>
                    📞 ${escapeHTML(
                        selectedProperty.phone
                    )}
                </strong>

                <br>

                <small>
                    📍 ${escapeHTML(
                        selectedProperty.address
                    )}
                </small>

            </div>

            <a
                href="tel:${escapeHTML(
                    selectedProperty.phone
                )}"
                class="primary-btn"
                style="
                    display:flex;
                    text-decoration:none;
                    max-width:300px;
                    margin:auto;
                "
            >
                📞 Call Owner
            </a>

        `;

    } else {

        box.innerHTML = `

            <div class="premium-lock">
                🔒
            </div>

            <h3>
                Owner Contact
            </h3>

            <p>
                Upgrade to Premium to view
                owner contact details.
            </p>

        `;

    }

}


/* =========================================================
   CLOSE PROPERTY
========================================================= */

function closePropertyModal() {

    const modal =
        document.getElementById(
            "propertyModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    selectedProperty = null;

}


/* =========================================================
   PREMIUM
========================================================= */

function showPremium() {

    const modal =
        document.getElementById(
            "premiumModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


function closePremium() {

    const modal =
        document.getElementById(
            "premiumModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   PAYMENT
========================================================= */

function submitPayment() {

    const name =
        getInputValue(
            "paymentName"
        );

    const upi =
        getInputValue(
            "paymentUpi"
        );

    const mobile =
        getInputValue(
            "paymentMobile"
        );

    const txn =
        getInputValue(
            "paymentTxn"
        );


    if (
        !name ||
        !upi ||
        !mobile ||
        !txn
    ) {

        showToast(
            "Please fill all payment details."
        );

        return;

    }


    if (
        !/^[0-9]{10}$/.test(
            mobile
        )
    ) {

        showToast(
            "Please enter a valid 10-digit mobile number."
        );

        return;

    }


    localStorage.setItem(
        "bachroom_payment_request",
        JSON.stringify({

            name,

            upi,

            mobile,

            txn,

            email:
                currentUser
                    ? currentUser.email
                    : "",

            submittedAt:
                new Date().toISOString()

        })
    );


    /*
       CURRENT PROJECT BEHAVIOUR:
       Demo premium activation.

       Real payment verification should
       eventually happen on backend.
    */

    isPremium = true;


    localStorage.setItem(
        "bachroom_premium",
        "true"
    );


    updatePremiumUI();

    closePremium();


    if (selectedProperty) {

        updateContactSection();

    }


    showToast(
        "Payment details submitted. Demo Premium activated."
    );

}


/* =========================================================
   PREMIUM UI
========================================================= */

function updatePremiumUI() {

    const status =
        document.getElementById(
            "premiumStatus"
        );


    if (!status) {

        return;

    }


    if (isPremium) {

        status.textContent =
            "⭐ PREMIUM ACTIVE";

        status.style.background =
            "#e2fff3";

        status.style.color =
            "#00895a";

    } else {

        status.textContent =
            "FREE PLAN";

        status.style.background =
            "#fff4d7";

        status.style.color =
            "#9a6a00";

    }

}


/* =========================================================
   STATS
========================================================= */

function updatePropertyStats() {

    const total =
        document.getElementById(
            "totalProperties"
        );


    if (total) {

        total.textContent =
            properties.length;

    }

}


function updateAdminStats() {

    const total =
        document.getElementById(
            "adminTotal"
        );


    if (total) {

        total.textContent =
            properties.length;

    }

}


/* =========================================================
   ADMIN PREVIEW
========================================================= */

function showCustomerPreview() {

    /*
       Admin preview intentionally does not
       create a fake Google session.
    */

    showPage(
        "customerDashboard"
    );


    renderProperties();

    updatePropertyStats();

    updatePremiumUI();

}


/* =========================================================
   SCROLL
========================================================= */

function scrollToTop() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   TEXT HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closePropertyModal();

            closePremium();

        }

    }
);


/* =========================================================
   MODAL BACKDROP
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.id ===
            "propertyModal"
        ) {

            closePropertyModal();

        }


        if (
            event.target.id ===
            "premiumModal"
        ) {

            closePremium();

        }

    }
);


/* =========================================================
   DEMO DATA
========================================================= */

function addDemoProperties() {

    const demoProperties = [

        {
            id:
                Date.now() + 1,

            title:
                "Affordable Student Room near Lalpur",

            type:
                "Room",

            price:
                4500,

            location:
                "Lalpur, Ranchi",

            address:
                "Demo Address, Lalpur, Ranchi",

            phone:
                "9876543210",

            images:
                [],

            createdAt:
                new Date().toISOString()
        },


        {
            id:
                Date.now() + 2,

            title:
                "Spacious 2BHK Family Flat",

            type:
                "2BHK",

            price:
                11000,

            location:
                "Morabadi, Ranchi",

            address:
                "Demo Address, Morabadi, Ranchi",

            phone:
                "9876543211",

            images:
                [],

            createdAt:
                new Date().toISOString()
        }

    ];


    properties = [
        ...demoProperties,
        ...properties
    ];


    localStorage.setItem(
        "bachroom_properties",
        JSON.stringify(
            properties
        )
    );


    updatePropertyStats();

    renderProperties();

    renderAdminProperties();

}
