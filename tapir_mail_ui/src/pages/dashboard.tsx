import React from 'react'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

function Dashboard() {
    return <div className="container">
        <Link to="/editor">
            <Button variant="primary">
                Start Editor
            </Button>
        </Link>
    </div>
}

export default Dashboard