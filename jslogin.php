<?php
session_start();
require_once('config.php');

$username = $_POST['username'] ?? $_POST['phoneno'];
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE (username = :user OR phoneno = :user) AND password = :pass LIMIT 1";
$stmtselect = $db->prepare($sql);
$result = $stmtselect->execute(['user' => $username, 'pass' => $password]); // ✅ Uses only named placeholders



if($result){
    $user = $stmtselect->fetch(PDO::FETCH_ASSOC);
    if($stmtselect->rowCount() > 0){
        $_SESSION['userlogin'] = $username;
        echo "Login Success!"; // Return success message
    }
    else{
        echo 'Invalid username or password!';
    }
} else {
    echo 'There is error. Please try again.';
}


?>
