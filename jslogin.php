<?php
session_start();
require_once('config.php');

$username = $_POST['username'];
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE username = ? and password = ? LIMIT 1";
$stmtselect = $db->prepare($sql);
$result = $stmtselect->execute([$username, $password]);


if($result){
    $user = $stmtselect->fetch(PDO::FETCH_ASSOC);
    if($stmtselect->rowCount() > 0){
        $_SESSION['userlogin'] = $username;
        echo "Login Success"; // Return success message
    }
    else{
        echo 'Invalid username or password!';
    }
} else {
    echo 'There is error/';
}


?>
