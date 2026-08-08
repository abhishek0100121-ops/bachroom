/* ==========================================
   BACHROOM.COM
   JavaScript
   Made by Abhishek Mishra
========================================== */

const ADMIN_PASSWORD = "Abhishek@299";

const BACKEND_URL =
    "https://bachroom-backend.onrender.com";


/* ==========================================
   GLOBAL DATA
========================================== */

let properties =
    JSON.parse(
        localStorage.getItem("bachroom_properties")
    ) || [];

let currentUser =
    JSON.parse(
        localStorage.getItem("bachroom_user")
    ) || null;

let isPremium =
    localStorage.getItem("bachroom_premium") === "true";

let selectedProperty = null;

let uploadedImages = [];


/* ==========================================
   PAGE INITIALIZATION
========================================== */

window.addEventListener("load", () => {

    setTimeout(() => {

        const loader =
            document.getElementById("loader");

        if (loader) {
            loader.classList.add("hide");
        }

    }, 900);


    updatePropertyStats();

    updatePremiumUI();

    showStoredSession();

    prepareGoogleLoginUI();

    checkGoogleLogin();

});


/* ==========================================
   PREPARE GOOGLE LOGIN UI
========================================== */

function prepareGoogleLoginUI() {

    const email =
        document.getElementById(
            "customerEmail"
        );

    if (email) {

        email.style.display = "none";

        email.value = "";

        email.removeAttribute(
            "required"
        );

    }


    document
        .querySelectorAll(
            "#customerLoginPage button"
        )
        .forEach(button => {

            const text =
                (
                    button.innerText || ""
                ).toLowerCase();


            if (
                text.includes(
                    "continue with gmail"
                ) ||
                text.includes(
                    "continue with google"
                )
            ) {

                button.setAttribute(
                    "onclick",
                    "customerLogin()"
                );


                const spans =
                    button.querySelectorAll(
                        "span"
                    );


                if (spans.length) {

                    spans[0].textContent =
                        "Continue with Google";

                } else {

                    button.textContent =
                        "Continue with Google →";

                }

            }

        });

}


/* ==========================================
   PAGE SWITCH
========================================== */

function hideAllPages() {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );

        });

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


/* ==========================================
   LOGIN PAGE
========================================== */

function goToLogin() {

    showPage("loginPage");

}


function showCustomerLogin() {

    showPage(
        "customerLoginPage"
    );

    prepareGoogleLoginUI();

}


function showAdminLogin() {

    showPage(
        "adminLoginPage"
    );


    setTimeout(() => {

        const password =
            document.getElementById(
                "adminPassword"
            );


        if (password) {

            password.focus();

        }

    }, 300);

}


/* ==========================================
   REAL GOOGLE LOGIN
========================================== */

/*
   IMPORTANT:

   Old demo login has been removed.

   The old system accepted any Gmail address.

   Now clicking customerLogin()
   redirects to the real Google OAuth backend.
*/

function customerLogin() {

    window.location.href =
        `${BACKEND_URL}/auth/google`;

}


/*
   Compatibility with any HTML button
   using onclick="googleLogin()"
*/

function googleLogin() {

    customerLogin();

}


/* ==========================================
   GOOGLE LOGIN CALLBACK
========================================== */

async function checkGoogleLogin() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const login =
        params.get("login");


    /*
       Google authentication failed
    */

    if (login === "failed") {

        showPage("loginPage");

        showToast(
            "Google login failed. Please try again."
        );


        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );


        return;

    }


    /*
       Nothing to check if this
       is a normal page load
    */

    if (login !== "success") {

        return;

    }


    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/me`,
                {

                    method: "GET",

                    credentials: "include",

                    headers: {

                        "Accept":
                            "application/json"

                    }

                }
            );


        if (!response.ok) {

            throw new Error(
                `Authentication request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data.authenticated ||
            !data.user
        ) {

            throw new Error(
                "Google session was not authenticated."
            );

        }


        /*
           Save REAL Google user
        */

        currentUser = {

            ...data.user,

            loginDate:
                new Date().toISOString()

        };


        localStorage.setItem(

            "bachroom_user",

            JSON.stringify(
                currentUser
            )

        );


        /*
           Remove ?login=success
           from browser URL
        */

        window.history.replaceState(

            {},

            document.title,

            window.location.pathname

        );


        /*
           Open customer dashboard
        */

        showCustomerDashboard();


        showToast(

            `Welcome, ${
                currentUser.name ||
                currentUser.email
            }!`

        );


    } catch (error) {

        console.error(

            "Google login verification failed:",

            error

        );


        window.history.replaceState(

            {},

            document.title,

            window.location.pathname

        );


        showPage("loginPage");


        showToast(

            "Google login verification failed. Please try again."

        );

    }

}


/* ==========================================
   ADMIN LOGIN
========================================== */

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


    showToast(
        "Admin login successful."
    );


    setTimeout(() => {

        showAdminDashboard();

    }, 400);

}


/* ==========================================
   PASSWORD VISIBILITY
========================================== */

function togglePassword() {

    const input =
        document.getElementById(
            "adminPassword"
        );


    if (!input) return;


    if (
        input.type ===
        "password"
    ) {

        input.type = "text";

    } else {

        input.type = "password";

    }

}


/* ==========================================
   SESSION
========================================== */

function showStoredSession() {

    /*
       Do not automatically force
       dashboard on page load.

       Real Google session is checked
       only after ?login=success.
    */

}


function showCustomerDashboard() {

    showPage(
        "customerDashboard"
    );


    renderProperties();

    updatePropertyStats();

    updatePremiumUI();

}


function showAdminDashboard() {

    showPage(
        "adminDashboard"
    );


    renderAdminProperties();

    updateAdminStats();

}


/* ==========================================
   LOGOUT
========================================== */

function logout() {

    currentUser = null;


    localStorage.removeItem(
        "bachroom_user"
    );


    localStorage.removeItem(
        "bachroom_admin"
    );


    showToast(
        "Logged out successfully."
    );


    /*
       Also logout from real
       Google session on backend.
    */

    window.location.href =
        `${BACKEND_URL}/auth/logout`;

}


/* ==========================================
   ADMIN PHOTO PREVIEW
========================================== */

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


    if (!input.files.length) {

        preview.innerHTML = "";

        return;

    }


    if (
        input.files.length < 2 ||
        input.files.length > 10
    ) {

        showToast(
            "Please select minimum 2 and maximum 10 photos."
        );


        input.value = "";

        preview.innerHTML = "";

        return;

    }


    preview.innerHTML = "";


    Array
        .from(input.files)
        .forEach(file => {

            const reader =
                new FileReader();


            reader.onload =
                function(event) {

                    uploadedImages.push(
                        event.target.result
                    );


                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "preview-image";


                    div.innerHTML = `

                        <img
                            src="${event.target.result}"
                            alt="Property Photo"
                        >

                    `;


                    preview.appendChild(
                        div
                    );

                };


            reader.readAsDataURL(
                file
            );

        });

}


/* ==========================================
   UPLOAD PROPERTY
========================================== */

function uploadProperty(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "propertyPhotos"
        );


    const files =
        input
            ? input.files
            : [];


    if (
        !files ||
        files.length < 2
    ) {

        showToast(
            "Please upload at least 2 photos."
        );

        return;

    }


    if (
        files.length > 10
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
            "Photos are still processing. Please wait."
        );

        return;

    }


    const getValue =
        id => {

            const element =
                document.getElementById(
                    id
                );


            return element
                ? element.value.trim()
                : "";

        };


    const title =
        getValue(
            "propertyTitle"
        );


    const type =
        document.getElementById(
            "propertyType"
        )?.value || "";


    const price =
        Number(
            document.getElementById(
                "propertyPrice"
            )?.value || 0
        );


    const location =
        getValue(
            "propertyLocation"
        );


    const address =
        getValue(
            "propertyAddress"
        );


    const phone =
        getValue(
            "propertyPhone"
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
            uploadedImages,

        createdAt:
            new Date().toISOString()

    };


    properties.unshift(
        property
    );


    localStorage.setItem(

        "bachroom_properties",

        JSON.stringify(
            properties
        )

    );


    showToast(
        "Rental property published successfully!"
    );


    document
        .getElementById(
            "propertyForm"
        )
        ?.reset();


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

}


/* ==========================================
   ADMIN PROPERTY LIST
========================================== */

function renderAdminProperties() {

    const container =
        document.getElementById(
            "adminPropertyList"
        );


    if (!container) return;


    if (!properties.length) {

        container.innerHTML = `

            <div
                class="empty-state"
                style="
                    display:block;
                    padding:40px;
                "
            >

                <div>🏠</div>

                <h3>
                    No properties uploaded yet
                </h3>

                <p>
                    Upload your first rental property above.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    properties.forEach(
        property => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "admin-property-item";


            item.innerHTML = `

                <img
                    src="${
                        property.images?.[0] ||
                        ""
                    }"
                    alt="${
                        escapeHTML(
                            property.title
                        )
                    }"
                >


                <div
                    class="admin-property-details"
                >

                    <strong>

                        ${
                            escapeHTML(
                                property.title
                            )
                        }

                    </strong>


                    <span>

                        ${
                            escapeHTML(
                                property.location
                            )
                        }

                        • ₹${property.price}/month

                    </span>


                    <span>

                        ${
                            escapeHTML(
                                property.type
                            )
                        }

                    </span>

                </div>


                <button
                    class="delete-btn"
                    onclick="deleteProperty(${property.id})"
                    title="Delete property"
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


/* ==========================================
   DELETE PROPERTY
========================================== */

function deleteProperty(id) {

    const confirmDelete =
        confirm(
            "Delete this rental property?"
        );


    if (!confirmDelete) {

        return;

    }


    properties =
        properties.filter(

            property =>
                property.id !== id

        );


    localStorage.setItem(

        "bachroom_properties",

        JSON.stringify(
            properties
        )

    );


    renderAdminProperties();

    updateAdminStats();

    updatePropertyStats();


    showToast(
        "Property deleted."
    );

}


/* ==========================================
   CUSTOMER PROPERTY RENDER
========================================== */

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


    if (!grid) return;


    grid.innerHTML = "";


    if (!list.length) {

        if (empty) {

            empty.style.display =
                "block";

        }


        const resultCount =
            document.getElementById(
                "resultCount"
            );


        if (resultCount) {

            resultCount.textContent =
                "0 properties";

        }


        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    const resultCount =
        document.getElementById(
            "resultCount"
        );


    if (resultCount) {

        resultCount.textContent =
            `${list.length} properties`;

    }


    list.forEach(
        (property, index) => {

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

                <div
                    class="property-image"
                >

                    ${
                        firstImage

                        ?

                        `
                        <img
                            src="${firstImage}"
                            alt="${
                                escapeHTML(
                                    property.title
                                )
                            }"
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


                    <div
                        class="property-type-badge"
                    >
                        ${
                            escapeHTML(
                                property.type
                            )
                        }
                    </div>


                    <div
                        class="property-lock"
                    >
                        🔒
                    </div>

                </div>


                <div
                    class="property-info"
                >

                    <h3>
                        ${
                            escapeHTML(
                                property.title
                            )
                        }
                    </h3>


                    <div
                        class="property-location"
                    >
                        📍
                        ${
                            escapeHTML(
                                property.location
                            )
                        }
                    </div>


                    <div
                        class="property-bottom"
                    >

                        <div
                            class="property-price"
                        >

                            ₹${
                                Number(
                                    property.price
                                ).toLocaleString(
                                    "en-IN"
                                )
                            }

                            <small>
                                /month
                            </small>

                        </div>


                        <button
                            class="view-btn"
                            onclick="openProperty(${property.id})"
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


/* ==========================================
   FILTER
========================================== */

function filterProperties() {

    const location =
        document
            .getElementById(
                "searchLocation"
            )
            ?.value
            .toLowerCase()
            .trim() || "";


    const type =
        document
            .getElementById(
                "searchType"
            )
            ?.value || "";


    const maxPrice =
        document
            .getElementById(
                "searchPrice"
            )
            ?.value || "";


    const filtered =
        properties.filter(
            property => {

                const matchesLocation =

                    !location ||

                    property.location
                        .toLowerCase()
                        .includes(
                            location
                        ) ||

                    property.title
                        .toLowerCase()
                        .includes(
                            location
                        );


                const matchesType =

                    !type ||

                    property.type ===
                    type;


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


/* ==========================================
   PROPERTY MODAL
========================================== */

function openProperty(id) {

    selectedProperty =
        properties.find(
            property =>
                property.id === id
        );


    if (!selectedProperty) {

        return;

    }


    const setText =
        (
            elementId,
            value
        ) => {

            const element =
                document.getElementById(
                    elementId
                );


            if (element) {

                element.textContent =
                    value;

            }

        };


    setText(
        "modalType",
        selectedProperty.type
    );


    setText(
        "modalType2",
        selectedProperty.type
    );


    setText(
        "modalTitle",
        selectedProperty.title
    );


    setText(

        "modalPrice",

        `₹${
            Number(
                selectedProperty.price
            ).toLocaleString(
                "en-IN"
            )
        }/month`

    );


    setText(

        "modalAddress",

        isPremium
            ? selectedProperty.address
            : "Premium access required"

    );


    const images =
        document.getElementById(
            "modalImages"
        );


    if (images) {

        images.innerHTML = "";


        (
            selectedProperty.images ||
            []
        ).forEach(
            image => {

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


    const modal =
        document.getElementById(
            "propertyModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }


    updateContactSection();

}


/* ==========================================
   CONTACT SECTION
========================================== */

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

            <div
                class="premium-lock"
            >
                ☎️
            </div>


            <h3>
                Owner Contact
            </h3>


            <p>
                You have Premium access.
            </p>


            <div
                style="
                    margin:15px 0;
                    padding:15px;
                    background:white;
                    border-radius:13px;
                "
            >

                <strong>

                    📞
                    ${
                        escapeHTML(
                            selectedProperty.phone
                        )
                    }

                </strong>


                <br>


                <small>

                    📍
                    ${
                        escapeHTML(
                            selectedProperty.address
                        )
                    }

                </small>

            </div>


            <a

                href="tel:${
                    escapeHTML(
                        selectedProperty.phone
                    )
                }"

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

            <div
                class="premium-lock"
            >
                🔒
            </div>


            <h3>
                Owner Contact
            </h3>


            <p>
                Upgrade to Premium to view owner contact details.
            </p>

        `;

    }

}


/* ==========================================
   CLOSE PROPERTY
========================================== */

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


/* ==========================================
   PREMIUM
========================================== */

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


/* ==========================================
   PAYMENT SUBMISSION
========================================== */

function submitPayment() {

    const getValue =
        id => {

            const element =
                document.getElementById(
                    id
                );


            return element
                ? element.value.trim()
                : "";

        };


    const name =
        getValue(
            "paymentName"
        );


    const upi =
        getValue(
            "paymentUpi"
        );


    const mobile =
        getValue(
            "paymentMobile"
        );


    const txn =
        getValue(
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
        mobile.length !== 10
    ) {

        showToast(
            "Please enter a valid 10-digit mobile number."
        );

        return;

    }


    /*
       Existing demo payment behavior
       is retained for now.
    */

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


    isPremium = true;


    localStorage.setItem(

        "bachroom_premium",

        "true"

    );


    updatePremiumUI();

    closePremium();


    showToast(
        "Demo Premium activated successfully!"
    );


    if (selectedProperty) {

        updateContactSection();

    }

}


/* ==========================================
   PREMIUM UI
========================================== */

function updatePremiumUI() {

    const status =
        document.getElementById(
            "premiumStatus"
        );


    if (!status) return;


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
            "#fff3d5";


        status.style.color =
            "#a26a00";

    }

}


/* ==========================================
   PROPERTY STATS
========================================== */

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


/* ==========================================
   ADMIN STATS
========================================== */

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


/* ==========================================
   CUSTOMER PREVIEW
========================================== */

function showCustomerPreview() {

    showCustomerDashboard();

}


/* ==========================================
   SCROLL TOP
========================================== */

function scrollToTop() {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* ==========================================
   TOAST
========================================== */

let toastTimer;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


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

            () => {

                toast.classList.remove(
                    "show"
                );

            },

            3000

        );

}


/* ==========================================
   HTML SECURITY
========================================== */

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
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


/* ==========================================
   ESC KEY
========================================== */

document.addEventListener(

    "keydown",

    function(event) {

        if (
            event.key ===
            "Escape"
        ) {

            closePropertyModal();

            closePremium();

        }

    }

);


/* ==========================================
   DEMO DATA
========================================== */

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

}
