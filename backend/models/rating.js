// Rating model
module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define(
    "Rating",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gallery_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "ratings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Rating.associate = (models) => {
    Rating.belongsTo(models.User, { foreignKey: "user_id" });
    Rating.belongsTo(models.Gallery, { foreignKey: "gallery_id" });
  };

  return Rating;
};
