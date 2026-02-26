"use server";

export async function testAction() {
    console.log("Test action called on server!");
    return { success: true, message: "Server action is working!" };
}
