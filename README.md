# Graceful Degradation Based Food Delivery System

## Project Overview
This project is a web-based food delivery application designed with the concept of **graceful degradation**. The system ensures that even if some features fail or the system is under heavy load, the core functionalities like ordering food and user authentication continue to work smoothly.

---

## Problem Statement
In modern web applications, especially distributed systems, failures are common. If one part of the system fails, it can affect the entire application and lead to poor user experience.

Additionally, existing food delivery platforms have limitations such as:
- Users can order from only one restaurant at a time
- System performance may degrade under high load
- Complete failure instead of partial functionality during issues

The challenge is to build a system that:
- Continues working even when some components fail
- Provides a smooth and reliable user experience
- Allows flexible food ordering


---

## Proposed Solution
We developed a food delivery web application that:
- Allows users to browse cities, restaurants, and menus
- Enables ordering from multiple restaurants
- Maintains core functionalities even under system stress

Using the concept of **graceful degradation**, the system:
- Prioritizes important features (login, ordering, payment)
- Reduces or disables non-essential features during failures
- Ensures continuous availability instead of complete breakdown

For example:
- If recommendations fail → ordering still works
- If load increases → system simplifies UI or limits features


---

## Key Features
- User Authentication (Login / Signup)
- City-based restaurant selection
- Multiple restaurant ordering
- Add to cart and checkout
- Simple and responsive UI
- Fault-tolerant design using graceful degradation

---

## Technologies Used
- HTML
- CSS
- JavaScript
- Bootstrap
- Firebase (Authentication)


---

## System Workflow
1. User creates account or logs in  
2. Selects city  
3. Views restaurants  
4. Selects dishes  
5. Adds items to cart  
6. Proceeds to payment  


---

## Objective
- Ensure system reliability during failures  
- Provide uninterrupted user experience  
- Minimize downtime  
- Maintain core functionality under high load  


---

## Future Scope
- Integration with local stores  
- Direct farm-to-restaurant supply system  
- Improved scalability and performance  


---

## Contributors
- Aastha Shukla  
- Abhay Kumar Dwivedi  
- Abhishek Mittal  
- Aditya Mishra  
- Ambar  
