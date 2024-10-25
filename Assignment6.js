//Tested using Postman for VSCode extension and databese maintained by MongoDB Atlas

//For testing POST i used "http://localhost:3000/gym-members","http://localhost:3000/gym-classes","http://localhost:3000/member-classes"
//and in body i select JSON and typed this: 
//json for creating gym members:
// {
//    "title": "blank",
//    "firstName": "blank",
//    "lastName": "blank",
//    "email": "blank@example.com",
//    "premiumMembership": true
// }
//json for creating gym classes:
// {
//     "className": "blank",
//     "classDay": "blank",
//     "sessionLength": 1,
//     "price": 0,
//     "currentNumber": 14
// }
//json for creating member-classes:
// {
//     "memberId": "6",
//     "classIds": ["3", "5", "2"]
// }

//For testing GET i used "http://localhost:3000/gym-members/[id]","http://localhost:3000/gym-classes[id]","http://localhost:3000/member-classes[id]"
// [id] would be 1,2,3 whicever you want to retreive

//For testing PUT i used "http://localhost:3000/gym-members/[id]","http://localhost:3000/gym-classes[id]","http://localhost:3000/member-classes[id]"
// [id] would be 1,2,3 whicever you want to modify
//and in body i select JSON and typed this: 
//json for updating gym members:
//{
//    "title": "updateblank",
//    "firstName": "updateblank",
//    "lastName": "updateblank",
//    "email": "updateblank@example.com",
//    "premiumMembership": false
// }
//json for updating gym classes:
// {
//     "className": "updatedblank",
//     "classDay": "updatedblank",
//     "sessionLength": 2,
//     "price": 0,
//     "currentNumber": 19
// }
//json for updating member-classes:
// {
//     "classIds": ["2", "3", "4"]
// }

//For testing DELETE i used "http://localhost:3000/gym-members/[id]","http://localhost:3000/gym-classes[id]","http://localhost:3000/member-classes[id]"
// [id] would be 1,2,3 whicever you want to delete
//also i made the code delete the member-classes assoocieted with any member that was deleted

// Import necessary modules
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
app.use(express.json());

// MongoDB URI with authentication details
const uri = 'mongodb+srv://RobertRus1:JJvCgVgQkxoANck6@cluster0.agkxhy1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
let db;

// Connect to MongoDB
async function connectToDatabase() {
    await client.connect();
    db = client.db('Assignment6');
    console.log('Connected to MongoDB Atlas');
}

// Function to get the next ID for a specific collection
async function getNextId(collection) {
    const latestEntry = await db.collection(collection).find().sort({ id: -1 }).limit(1).toArray();
    return latestEntry.length === 0 ? 1 : latestEntry[0].id + 1;
}

// Gym Member CRUD operations
app.post('/gym-members', async (req, res) => {
    console.log('Received body:', req.body);

    try {
        const newId = await getNextId('gymMembers');
        console.log('New ID:', newId);  

        const newMember = {
            id: newId,
            title: req.body.title,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            premiumMembership: req.body.premiumMembership
        };
        console.log('New member object:', newMember);  

        await db.collection('gymMembers').insertOne(newMember);
        res.status(201).send(newMember);
    } catch (err) {
        console.error('Error creating gym member:', err);
        res.status(500).send('Error creating gym member: ' + err.message);
    }
});

app.get('/gym-members/:id', async (req, res) => {
    try {
        const memberId = parseInt(req.params.id); 
        if (isNaN(memberId)) {
            return res.status(400).send('Invalid ID format');
        }

        const member = await db.collection('gymMembers').findOne({ id: memberId });
        if (member) {
            res.status(200).send(member);
        } else {
            res.status(404).send('No member found');
        }
    } catch (err) {
        console.error('Error retrieving gym member:', err);
        res.status(500).send('Error retrieving gym member: ' + err.message);
    }
});

app.put('/gym-members/:id', async (req, res) => {
    try {
        const result = await db.collection('gymMembers').updateOne({ id: parseInt(req.params.id) }, { $set: req.body });
        result.modifiedCount ? res.status(200).send('Member updated') : res.status(404).send('No member found');
    } catch (err) {
        res.status(500).send('Error updating gym member: ' + err.message);
    }
});

app.delete('/gym-members/:id', async (req, res) => {
    try {
        const memberId = parseInt(req.params.id);
        // First, delete the gym member
        const memberResult = await db.collection('gymMembers').deleteOne({ id: memberId });
        if (memberResult.deletedCount) {
            // If the member was successfully deleted, delete their linkages
            const linkageResult = await db.collection('memberClasses').deleteMany({ memberId: memberId });
            res.status(200).send({
                message: 'Member deleted',
                linkagesDeleted: linkageResult.deletedCount
            });
        } else {
            res.status(404).send('No gym member found');
        }
    } catch (err) {
        console.error('Error deleting gym member and their linkages:', err);
        res.status(500).send('Error deleting gym member: ' + err.message);
    }
});

// Gym Class CRUD operations
app.post('/gym-classes', async (req, res) => {
    try {
        const newId = await getNextId('gymClasses');
        const newClass = { id: newId, ...req.body };
        await db.collection('gymClasses').insertOne(newClass);
        res.status(201).send(newClass);
    } catch (err) {
        res.status(500).send('Error creating gym class: ' + err.message);
    }
});

app.get('/gym-classes/:id', async (req, res) => {
    try {
        const gymClass = await db.collection('gymClasses').findOne({ id: parseInt(req.params.id) });
        gymClass ? res.status(200).send(gymClass) : res.status(404).send('No class found');
    } catch (err) {
        res.status(500).send('Error retrieving gym class: ' + err.message);
    }
});

app.put('/gym-classes/:id', async (req, res) => {
    try {
        const result = await db.collection('gymClasses').updateOne({ id: parseInt(req.params.id) }, { $set: req.body });
        result.modifiedCount ? res.status(200).send('Class updated') : res.status(404).send('No class found');
    } catch (err) {
        res.status(500).send('Error updating gym class: ' + err.message);
    }
});

app.delete('/gym-classes/:id', async (req, res) => {
    try {
        const result = await db.collection('gymClasses').deleteOne({ id: parseInt(req.params.id) });
        result.deletedCount ? res.status(200).send('Class deleted') : res.status(404).send('No class found');
    } catch (err) {
        res.status(500).send('Error deleting gym class: ' + err.message);
    }
});

// Member-Class Linkages operations
app.post('/member-classes', async (req, res) => {
    try {
        if (!req.body.classIds || req.body.classIds.length !== 3) {
            return res.status(400).send('Each member must be linked to exactly three gym classes.');
        }

        const classIds = req.body.classIds.map(id => parseInt(id));
        const classesCount = await db.collection('gymClasses').countDocuments({
            id: { $in: classIds }
        });

        if (classesCount !== 3) {
            return res.status(400).send('One or more class IDs are invalid or do not exist.');
        }

        const newId = await getNextId('memberClasses'); 
        const newLinkage = {
            id: newId,
            memberId: parseInt(req.body.memberId),
            classIds: classIds
        };

        await db.collection('memberClasses').insertOne(newLinkage);
        res.status(201).send(newLinkage);
    } catch (err) {
        console.error('Error creating member-class linkage:', err);
        res.status(500).send('Error creating member-class linkage: ' + err.message);
    }
});

app.get('/member-classes/:id', async (req, res) => {
    try {
        const linkage = await db.collection('memberClasses').findOne({ id: parseInt(req.params.id) });
        linkage ? res.status(200).send(linkage) : res.status(404).send('No linkage found');
    } catch (err) {
        res.status(500).send('Error retrieving member-class linkage: ' + err.message);
    }
});

app.put('/member-classes/:id', async (req, res) => {
    try {
        if (!req.body.classIds || req.body.classIds.length !== 3) {
            return res.status(400).send('Each member must be linked to exactly three gym classes.');
        }

        const classIds = req.body.classIds.map(id => parseInt(id));

        const result = await db.collection('memberClasses').updateOne(
            { id: parseInt(req.params.id) },
            { $set: { classIds: classIds } }
        );

        if (result.modifiedCount) {
            res.status(200).send('Member-class linkage updated');
        } else {
            res.status(404).send('No member-class linkage found with the given ID');
        }
    } catch (err) {
        console.error('Error updating member-class linkage:', err);
        res.status(500).send('Error updating member-class linkage: ' + err.message);
    }
});

app.delete('/member-classes/:id', async (req, res) => {
    try {
        const result = await db.collection('memberClasses').deleteOne({ id: parseInt(req.params.id) });
        result.deletedCount ? res.status(200).send('Linkage deleted') : res.status(404).send('No linkage found');
    } catch (err) {
        res.status(500).send('Error deleting member-class linkage: ' + err.message);
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    connectToDatabase();
});