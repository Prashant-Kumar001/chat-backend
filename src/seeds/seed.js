import User from "../models/user.Model.js";
import Chat from "../models/user.chat.js";
import { faker } from "@faker-js/faker";
const createUser = async (count) => {
  const promiseUser = [];
  try {
    for (let i = 0; i < count; i++) {
      const user = await User.create({
        username: faker.person.fullName(),
        email: faker.internet.email(),
        password: "password",
        avatar: {
          public_id: faker.system.fileName(),
          secure_url: faker.image.avatar(),
        },
        role: faker.helpers.arrayElement(["user", "admin"]),
      });
      promiseUser.push(user);
    }
    await Promise.all(promiseUser);
    console.log(`User created successfully.`, count);
    process.exit(1);

  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
};

const createMessage = async (count) => {
  const promiseMessage = [];
  try {
    for (let i = 0; i < count; i++) {
      const message = await Message.create({
        sender: faker.datatype.uuid(),
        receiver: faker.datatype.uuid(),
        message: faker.lorem.sentence(),
      });
      promiseMessage.push(message);
    }
    await Promise.all(promiseMessage);
    console.log(`Message created successfully.`, count);
    process.exit(1);

  } catch (error) {
    console.error("Error creating messages:", error);
    process.exit(1);
  }
}


const createSingleChat = async (count) => {
  const user = await User.find().select("_id")
  const promiseChat = [];
  try {

  } catch (error) {

  }
}

export {
  createUser,
  createMessage,
  createSingleChat
}