import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionModule } from './modules/session/session.module';
import { SeatModule } from './modules/seats/seat.module';

@Module({
  imports: [SessionModule, SeatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

TypeOrmModule.forRoot({
  type: "postgres",
  host: "postgres",
  port: 5432,
  username: "cinema",
  password: "cinema",
  database: "cinema",
  autoLoadEntities: true,
  synchronize: true,
});