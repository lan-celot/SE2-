<?php
require_once('config.php');

if (isset($_POST['register'])) {
    $fname = $_POST["fname"];
    $lname = $_POST["lname"];
    $username = $_POST["username"];
    $phoneno = $_POST["phoneno"];
    $gender = $_POST["gender"];
    $password = $_POST["password"];
    $confirm_password = $_POST["confirm-password"];

    if ($password !== $confirm_password) {
        echo "<script>alert('Passwords do not match!'); window.location.href='Cust_Reg_Page.php';</script>";
        exit;
    }

    $sql = "INSERT INTO users (fname, lname, username, phoneno, gender, password) VALUES(?,?,?,?,?,?)";
    $stmtinsert = $db->prepare($sql);
    $result = $stmtinsert->execute([$fname, $lname, $username, $phoneno, $gender, $password]);

    if ($result) {
        echo "<script>alert('Registration successful! Redirecting...'); window.location.href='Cust_Login_Page.php';</script>";
        exit;
    } else {
        echo "<script>alert('Error registering user!');</script>";
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="initial-scale=1, width=device-width">
    <link rel="stylesheet" href="./Cust_Reg_Page.css" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@200;400;500;600&display=swap" />
</head>
<body>
    <form method="post" action="Cust_Reg_Page.php">
        <div class="customer-register-page">
            <div class="homepage-parent">
                <div class="homepage">
                    <img class="homepage-child" alt="" src="Frame 1021.png">
                    <input type="submit" name='register' class="register-login" value="Register" onClick="myFunction()" /> 
                    <div class="form">
                        <input type="text" id="first-name" name="fname" class="first-name-wrapper" placeholder="First name" required>
                        <input type="text" id="last-name" name="lname" class="last-name-wrapper" placeholder="Last name" required>
                        <input type="text" id="username" name="username" class="last-name-wrapper" placeholder="Username" required>
                        <input type="text" id="phone" name="phoneno" class="last-name-wrapper" placeholder="Phone number (09171234567)" required>
                        <select id="gender" name="gender" class="last-name-wrapper" required>
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        <input type="password" id="password" name="password" class="last-name-wrapper" placeholder="Password" required>
                        <img class="vuesaxlinearpassword-check-icon1" alt="" src="vuesax/linear/password-check.svg" onClick="showPass()">
                        <input type="password" id="confirm-password" name="confirm-password" class="last-name-wrapper" placeholder="Confirm Password" required>
                    </div>
                    <div class="homepage-item"></div>
                    <div class="rev-up-your-container">
                        <span>Rev</span>
                        <span class="up-your-experience"> Up Your Experience: Join Us and Get Started!</span>
                    </div>
                    <img class="pngitem-902964-1-icon" alt="" src="PngItem_902964 1.png">
                    <div class="i-have-read-and-agreed-to-term-parent">
                        <div class="i-have-read-container" id="iHaveRead">
                            <span class="i-have-read">I have read and agreed to </span>
                            <span class="terms-and-conditions">Terms and Conditions</span>
                        </div>
                        <div class="checkbox-material-design">
                            <input type="checkbox" required>
                        </div>
                    </div>
                </div>
                <div class="header">
                    <div class="mar-nor">MAR & NOR AUTO REPAIR</div>
                    <img class="logo-icon" alt="" src="Logo.svg">
                </div>
            </div>
            <div class="footer">
                <div class="frame-parent">
                    <div class="frame-wrapper">
                        <div class="vuesaxlinearlocation-parent">
                            <img class="vuesaxlinearlocation-icon" alt="" src="vuesax/linear/location.svg">
                            <div class="jp-rizal-1208">567 J.P. Rizal, 1208, Makati, Metro Manila, Philippines</div>
                        </div>
                    </div>
                    <div class="logo-parent">
                        <img class="logo-icon1" alt="" src="Logo.svg">
                        <div class="mar-nor1">MAR & NOR AUTO REPAIR</div>
                    </div>
                    <div class="vuesaxlinearsms-parent">
                        <img class="vuesaxlinearsms-icon" alt="" src="vuesax/linear/sms.svg">
                        <div class="marnorautorepairgmailcom">mar&nor.autorepair@gmail.com</div>
                    </div>
                    <div class="vuesaxlinearcall-parent">
                        <img class="vuesaxlinearsms-icon" alt="" src="vuesax/linear/call.svg">
                        <a class="a" href="tel:+632 897 5973" target="_blank">+632 897 5973</a>
                    </div>
                    <div class="copyright-2024">Copyright 2024 ・ Mar & Nor Auto Repair, All Rights Reserved</div>
                </div>
                <div class="terms-conditions-parent" id="frameContainer1">
                    <div class="marnorautorepairgmailcom">Terms & Conditions</div>
                    <img class="vuesaxlinearsms-icon" alt="" src="vuesax/linear/security.svg">
                </div>
            </div>
        </div>
    </form>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            document.querySelector("form").addEventListener("submit", function(event) {
                let password = document.getElementById("password").value;
                let confirmPassword = document.getElementById("confirm-password").value;
                if (password !== confirmPassword) {
                    event.preventDefault();
                    alert("Passwords do not match!");
                }
            });
        });

        function showPass() {
            var x = document.getElementById("password");
            x.type = (x.type === "password") ? "text" : "password";
        }
    </script>
</body>
</html>
