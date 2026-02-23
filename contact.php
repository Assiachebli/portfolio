<?php
// Enable all error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers - MUST BE AT THE VERY TOP
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Configuration - Adjust based on your local environment
$host = 'localhost';
$dbname = 'portfolio_db';
$username = 'root'; // Default for XAMPP
$password = '';     // Default for XAMPP

try {
    // 3. Create connection
    $conn = new mysqli($host, $username, $password, $dbname);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // 4. Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {

        // Basic Validation
        $name = isset($data['name']) ? trim($data['name']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $message = isset($data['message']) ? trim($data['message']) : '';

        if (empty($name) || empty($email) || empty($message)) {
            echo json_encode(["status" => "error", "message" => "All fields are required."]);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(["status" => "error", "message" => "Invalid email format."]);
            exit;
        }

        // 5. Use Prepared Statement for safety
        // Note: Table name changed to 'contacts' as per request
        $stmt = $conn->prepare("INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("sss", $name, $email, $message);

        // 6. Execute and respond
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Your message has been saved successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }

        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    }

    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>