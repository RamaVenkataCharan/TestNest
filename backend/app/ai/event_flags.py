# Face Detection
multiple_faces_logged = False

# Eye Tracking
looking_away_logged = False

# Head Pose
head_direction_logged = False

# Object Detection
phone_logged = False

def reset_flags():
    global multiple_faces_logged
    global looking_away_logged
    global head_direction_logged
    global phone_logged

    multiple_faces_logged = False
    looking_away_logged = False
    head_direction_logged = False
    phone_logged = False