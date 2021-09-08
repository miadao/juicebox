const { Client } = require('pg') 

const client = new Client('postgres://localhost:5432/juicebox-dev');

async function createUser({ username, password, name, location }) {
    console.log("1",  username, password, name, location )
    try {
        const { rows: [ user ] } = await client.query(`
        INSERT INTO users(username, password, name, location) 
        VALUES($1, $2, $3, $4) 
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
        `, [username, password, name, location]);

        return user;
    } catch (error) {
        throw error;
    }
}

async function createPost({ authorId, title, content, tags=[] }) {
    try {
        const { rows: [ post ] } = await client.query(`
        INSERT INTO posts("authorId", title, content)
        VALUES($1, $2, $3)
        
        RETURNING *;
        `, [authorId, title, content])

        return post;
    } catch (error) {
        console.log("error creating a post")
      throw error;
    }
  }

async function getAllUsers() {
    try {
        const { rows } = await client.query(`SELECT id, username, name, location, active FROM users;`);
        return rows;
    } catch(error){
        console.log("error getting all users")
        throw error;
    }
}

async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    // return early if this is called without fields
    if (setString.length === 0) {
      return;
    }
  
    try {
      const { rows: [ user ] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
     
  
      return user;
    } catch (error) {
      throw error;
    }
  }

async function updatePost(id, fields={ title,content,active }) { //FINISH THIS, MIMIC updateUser
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
      ).join(', ');

    try {
        const { rows: [ post ] } = await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${id}
        RETURNING *;
        `, Object.values(fields))
        return post;
        
    } catch (error) {
        throw error;
    }
}

async function getAllPosts() {
    try {
        const { rows } = await client.query(`SELECT id, "authorId", title, content, active FROM posts;`)
        return rows;
    } catch (error) {
      throw error;
    }
  }

async function getPostsByUser(userId) {
    try {
        const { rows } = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${ userId };
        `);

        return rows;
    } catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    // first get the user (NOTE: Remember the query returns 
      // (1) an object that contains 
      // (2) a `rows` array that (in this case) will contain 
      // (3) one object, which is our user.
    // if it doesn't exist (if there are no `rows` or `rows.length`), return null
  
    // if it does:
    // delete the 'password' key from the returned object
    // get their posts (use getPostsByUser)
    // then add the posts to the user object with key 'posts'
    // return the user object
    
    try {
        const { rows: [ user ] } = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${ userId };
        `);
        if (rows.length === 0) {
            return null;
        } else {
            
            client.query(`
            DELETE FROM users WHERE ${user.password}="password"
            INSERT INTO ${user.posts} 
            VALUES (${getPostsByUser()})
            RETURNING ${user};
            `)
        }

        return user;

    } catch (error) {
        throw error;
    }
  }

module.exports = {  
  client,
  createUser,
  getAllUsers,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById
}