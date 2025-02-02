<?php
session_start();
if(!isset($_SESSION['userlogin'])){
    header('Location: Cust_Login_Page.php');
    exit();
}


if(isset($_GET['logout'])){
    session_destroy();
    header('Location: Cust_Login_Page.php');
}

?>

<p> welcome to webpage </p>

<a href="index.php?logout=true">Logout</a>