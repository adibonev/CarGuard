import React from 'react';

const CarList = ({ cars, selectedCar, onSelectCar, onDeleteCar }) => {
  if (cars.length === 0) {
    return <p className="no-data">No vehicles added</p>;
  }

  return (
    <div className="car-list">
      {cars.map(car => (
        <div
          key={car._id}
          className={`car-item ${selectedCar?._id === car._id ? 'selected' : ''}`}
          onClick={() => onSelectCar(car)}
        >
          <div className="car-info">
            <h3>{car.brand} {car.model}</h3>
            <p>Year: {car.year}</p>
            {car.licensePlate && <p>Plate: {car.licensePlate}</p>}
          </div>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure?')) {
                onDeleteCar(car._id);
              }
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default CarList;
