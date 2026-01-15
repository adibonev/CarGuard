import React from 'react';

const CarList = ({ cars, selectedCar, onSelectCar, onDeleteCar }) => {
  if (cars.length === 0) {
    return <p className="no-data">Нямаш добавени автомобили</p>;
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
            <p>Година: {car.year}</p>
            {car.licensePlate && <p>Рег. табличка: {car.licensePlate}</p>}
          </div>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Сигурен ли си?')) {
                onDeleteCar(car._id);
              }
            }}
          >
            Изтрий
          </button>
        </div>
      ))}
    </div>
  );
};

export default CarList;
