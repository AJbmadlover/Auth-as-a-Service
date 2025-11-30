day1: Picked my 30 day task project(Auth-as-a-service)

day2: made a plan.md document

day3: completed folder structures

day4: db configuration

day5: user schema 

day6: signup route and controller setup (test with a valid email address and password);

day7: login route and refresh token setup (HTTP only) //using cookieOptions 

day8: email verification setup 
email verification was setup using resend API, upon getting the API key i added the details to my .env file, then created email templates, afterwards i created two controllers, one to resend email verification, the other two verify the email that was sent 

day9: Password reset
password reset was setup using resend API, when a user requests for a password reset we send them an email, and upon clicking that email, the user is prompted to fill in two sets of passwords, the "new password" and a "confirmation of the new password", after that the new password is updated as the hashed password in the database. 

Also, i created a change password route, which is only available to users that have already been logged into the system. I did this by creating a middleware called protect, this middleware checks for a valid token in the header, then once the token has been verfied the user is allowed to hit the protect URL. 