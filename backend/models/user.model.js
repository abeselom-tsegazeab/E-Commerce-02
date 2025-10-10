import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			minlength: [6, "Password must be at least 6 characters long"],
			// Password is not required for OAuth users
			required: function() { return !this.authProvider; },
		},
		cartItems: [
			{
				quantity: {
					type: Number,
					default: 1,
				},
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
				},
			},
		],
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},
		profilePicture: {
			type: String,
			default: "",
		},
		authProvider: {
			provider: {
				type: String,
				enum: ["google", "github", "facebook", null],
				default: null,
			},
			id: {
				type: String,
				default: null,
			},
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		lastLogin: {
			type: Date,
		},
		loginCount: {
			type: Number,
			default: 0,
		},
		refreshToken: {
			type: String,
			select: false, // Don't return this field in queries by default
		},
	},
	{
		timestamps: true,
	}
);

// Pre-save hook to hash password before saving to database
userSchema.pre("save", async function (next) {
	// Only hash the password if it's modified (or new) and not empty
	if (!this.isModified("password") || !this.password) return next();
	
	// For OAuth users, we don't need a password
	if (this.authProvider?.provider && !this.password) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (password) {
  try {
    if (!password) {
      console.error('No password provided for comparison');
      return false;
    }
    if (!this.password) {
      console.error('No hashed password found for user');
      return false;
    }
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

const User = mongoose.model("User", userSchema);

export default User;
