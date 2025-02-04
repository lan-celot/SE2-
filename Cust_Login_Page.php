<?php
session_start();


if(isset($_SESSION['userlogin'])){
	header('Location: index.php');
	exit();
}
?>


<!DOCTYPE html>
<html>
<head>
  	<meta charset="utf-8">
  	<meta name="viewport" content="initial-scale=1, width=device-width">
  	
  	<link rel="stylesheet"  href="./Cust_Login_Page.css" />
  	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" />
  	
  	
  	
</head>
<body>
    
  	<form id = "form">
  	<div class="customer-login-page">
    		<div class="homepage-parent">
      			<div class="homepage">
        				<img class="homepage-child" alt="" src="Frame 1021.png">
        				
        				<div class="ready-to-drive-container">
          					<p class="ready-to-drive-back-in">
            						<span class="ready">Ready</span>
            						<span> to Drive Back in?</span>
          					</p>
          					<p class="ready-to-drive-back-in">Start your Engines!</p>
        				</div>
        				<img class="pngitem-902964-1-icon" alt="" src="PngItem_902964 1.png">
        
        				<div class="frame-parent">
                            <div class="rectangle-parent">
                              <div class="frame-child"></div>
                              
                               <input type="text" id="username" name="username" class="username-or-phone-number-0917-wrapper" placeholder="Username or Phone Number (09171234567)" required>
                          
                              
                        
                                <div class="password-wrapper">
                                  <input type="password" id="password" name="password" class="password-parent" placeholder="Password" required>
                                  <img class="vuesaxlinearpassword-check-icon" alt="" src="vuesax/linear/password-check.svg" onClick="showPass()">
                              </div>
                            </div>
                            
                            <div class="or-register" id="orRegisterText"><a href = "Cust_Reg_Page.php">or Register</a></div>
                            

                              <input type="submit" id="login" class="login-wrapper" value="Log-in">

                          </div>
                          
      			</div>
      			<div class="header">
        				<div class="mar-nor">MAR & NOR AUTO REPAIR</div>
        				<img class="logo-icon" alt="" src="Logo.svg">
        				
      			</div>
    		</div>
    		<div class="footer">
      			<div class="frame-group">
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
        				<div class="frame-item">
        				</div>
      			</div>
      			<div class="terms-conditions-parent" id="frameContainer1">
        				<div class="marnorautorepairgmailcom">Terms & Conditions</div>
        				<img class="vuesaxlinearsms-icon" alt="" src="vuesax/linear/security.svg">
        				
      			</div>
    		</div>
  	</div>
  	</form>
  	<script src="https://code.jquery.com/jquery-3.3.1.min.js" 
    integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" 
    crossorigin="anonymous"></script>


<script type="text/javascript" src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>  	
  	
  	<script>	
    	     function showPass() {
  var x = document.getElementById("password")
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
		
    		}
			</script>
<script>

$(document).ready(function() {
	$(function(){
	$('#login').click(function(e){
		var valid = this.form.checkValidity();

		if(valid){
            var username = $('#username').val(); //
			var password = $('#password').val(); // Fetch password from the form

		}
		e.preventDefault();
            $.ajax({
                type: 'POST',
                url: 'jslogin.php',
                data: {username: username, password: password},
				success: function(data){
    alert(data);
    if($.trim(data) === "Login Success!"){ // Check for the 'success' response
        window.location.href = "index.php"; // Redirect to index.php
    }
}
,
                error: function(data){
                    alert('error');
                }
            });
        });
    });

});


</script>

</body>
</html>
